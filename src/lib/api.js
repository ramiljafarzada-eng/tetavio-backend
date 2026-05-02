const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredApiBaseUrl) {
  throw new Error(
    "Missing VITE_API_BASE_URL. Define VITE_API_BASE_URL before building or running the frontend.",
  );
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

let activeSession = null;

export function setApiSession(session) {
  activeSession = session || null;
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function sanitizeInvoiceLinePayload(line = {}) {
  return {
    itemName: line.itemName,
    description: line.description,
    quantity: line.quantity,
    unitPriceMinor: line.unitPriceMinor,
    taxCode: line.taxCode,
    taxRate: line.taxRate,
  };
}

function sanitizeInvoicePayload(payload = {}) {
  return {
    customerId: payload.customerId,
    invoiceNumber: payload.invoiceNumber,
    status: payload.status,
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    currency: payload.currency,
    notes: payload.notes,
    ...(Array.isArray(payload.lines)
      ? { lines: payload.lines.map((line) => sanitizeInvoiceLinePayload(line)) }
      : {}),
  };
}

function unwrapEnvelope(payload) {
  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success) return payload.data;
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError ||
      /Failed to fetch|fetch failed|NetworkError/i.test(String(error?.message || ""));

    if (isNetworkError) {
      const networkError = new Error(
        "Backend server is not reachable. Please make sure backend is running.",
      );
      networkError.code = "BACKEND_UNREACHABLE";
      networkError.cause = error;
      throw networkError;
    }

    throw error;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return unwrapEnvelope(payload);
}

export async function authRequest(path, options = {}, onSessionUpdate) {
  if (!activeSession?.accessToken) {
    throw new Error("Not authenticated");
  }

  try {
    return await apiRequest(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${activeSession.accessToken}`,
      },
    });
  } catch (error) {
    if (error.status !== 401 || !activeSession?.refreshToken) {
      throw error;
    }

    const rotated = await refreshTokens(activeSession.refreshToken);
    const nextSession = {
      ...activeSession,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    };

    activeSession = nextSession;
    if (typeof onSessionUpdate === "function") {
      onSessionUpdate(nextSession);
    }

    return apiRequest(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${nextSession.accessToken}`,
      },
    });
  }
}

export function apiLogin(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function apiRegister(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function apiRequestPasswordReset(email) {
  return apiRequest("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function apiConfirmPasswordReset(token, password) {
  return apiRequest("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function refreshTokens(refreshToken) {
  return apiRequest("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function apiMe(onSessionUpdate) {
  return authRequest("/auth/me", { method: "GET" }, onSessionUpdate);
}

export function apiGetPlans() {
  return apiRequest("/plans", { method: "GET" });
}

export function apiGetCurrentSubscription(onSessionUpdate) {
  return authRequest("/subscription/current", { method: "GET" }, onSessionUpdate);
}

export function apiUpgradeSubscription(targetPlanCode, onSessionUpdate) {
  return authRequest(
    "/subscription/upgrade",
    {
      method: "POST",
      body: JSON.stringify({ targetPlanCode }),
    },
    onSessionUpdate,
  );
}

export function apiSwitchToFree(onSessionUpdate) {
  return authRequest("/subscription/switch-to-free", { method: "POST" }, onSessionUpdate);
}

export function apiSwitchToDemo(onSessionUpdate) {
  return authRequest("/subscription/switch-to-demo", { method: "POST" }, onSessionUpdate);
}

export function apiGetMyOrders(onSessionUpdate) {
  return authRequest("/orders/me", { method: "GET" }, onSessionUpdate);
}

export function apiCheckout(orderId, onSessionUpdate) {
  return authRequest(
    "/payments/checkout",
    {
      method: "POST",
      body: JSON.stringify({ orderId }),
    },
    onSessionUpdate,
  );
}

export function apiMockWebhook(payload) {
  return apiRequest("/payments/webhooks/mock", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function apiGetAdminOverview(onSessionUpdate) {
  return authRequest("/internal/overview", { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminAccounts(params = {}, onSessionUpdate) {
  return authRequest(`/internal/accounts${buildQueryString(params)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminFinance(onSessionUpdate) {
  return authRequest("/internal/finance", { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminSubscriptions(params = {}, onSessionUpdate) {
  return authRequest(`/internal/subscriptions${buildQueryString(params)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminActivity(params = {}, onSessionUpdate) {
  return authRequest(`/internal/activity${buildQueryString(params)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminSystemHealth(onSessionUpdate) {
  return authRequest("/internal/system-health", { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminAnomalies(params = {}, onSessionUpdate) {
  return authRequest(`/internal/anomalies${buildQueryString(params)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetAdminAccountDetail(id, onSessionUpdate) {
  return authRequest(`/internal/accounts/${id}`, { method: "GET" }, onSessionUpdate);
}

export function apiAddAdminNote(accountId, payload, onSessionUpdate) {
  return authRequest(`/internal/accounts/${accountId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, onSessionUpdate);
}

export function apiAdminFlagAccount(accountId, payload, onSessionUpdate) {
  return authRequest(`/internal/accounts/${accountId}/flag`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, onSessionUpdate);
}

export function apiAdminUnflagAccount(accountId, payload, onSessionUpdate) {
  return authRequest(`/internal/accounts/${accountId}/unflag`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, onSessionUpdate);
}

export function apiAdminReviewAnomaly(payload, onSessionUpdate) {
  return authRequest("/internal/anomalies/review", {
    method: "POST",
    body: JSON.stringify(payload),
  }, onSessionUpdate);
}

export function apiGetFinancialInsights(onSessionUpdate) {
  return authRequest("/insights/financial", { method: "GET" }, onSessionUpdate);
}

export function apiGetCashflowForecast(onSessionUpdate) {
  return authRequest("/insights/cashflow", { method: "GET" }, onSessionUpdate);
}

export function apiGetFinancialTrends(onSessionUpdate) {
  return authRequest("/insights/trends", { method: "GET" }, onSessionUpdate);
}

export function apiGetAccountsReceivableAging(onSessionUpdate) {
  return authRequest("/reports/accounts-receivable-aging", { method: "GET" }, onSessionUpdate);
}

export function apiLogout(refreshToken) {
  return apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function apiGetCompanySettings(onSessionUpdate) {
  return authRequest("/company-settings/me", { method: "GET" }, onSessionUpdate);
}

export function apiUpdateCompanySettings(payload, onSessionUpdate) {
  return authRequest(
    "/company-settings/me",
    {
      method: "PATCH",
      body: JSON.stringify({
        companyName: payload?.companyName,
        taxId: payload?.taxId,
        mobilePhone: payload?.mobilePhone,
        entityType: payload?.entityType,
        currency: payload?.currency,
        fiscalYear: payload?.fiscalYear,
      }),
    },
    onSessionUpdate,
  );
}

export function apiListCustomers(query = {}, onSessionUpdate) {
  return authRequest(`/customers${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetCustomerById(customerId, onSessionUpdate) {
  return authRequest(`/customers/${customerId}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateCustomer(payload, onSessionUpdate) {
  return authRequest(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify({
        displayName: payload?.displayName,
        companyName: payload?.companyName,
        email: payload?.email,
        phone: payload?.phone,
        taxId: payload?.taxId,
        status: payload?.status,
      }),
    },
    onSessionUpdate,
  );
}

export function apiUpdateCustomer(customerId, payload, onSessionUpdate) {
  return authRequest(
    `/customers/${customerId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        displayName: payload?.displayName,
        companyName: payload?.companyName,
        email: payload?.email,
        phone: payload?.phone,
        taxId: payload?.taxId,
        status: payload?.status,
      }),
    },
    onSessionUpdate,
  );
}

export function apiDeleteCustomer(customerId, onSessionUpdate) {
  return authRequest(`/customers/${customerId}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListVendors(query = {}, onSessionUpdate) {
  return authRequest(`/vendors${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetVendorById(vendorId, onSessionUpdate) {
  return authRequest(`/vendors/${vendorId}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateVendor(payload, onSessionUpdate) {
  return authRequest(
    "/vendors",
    {
      method: "POST",
      body: JSON.stringify({
        vendorName: payload?.vendorName,
        companyName: payload?.companyName,
        email: payload?.email,
        phone: payload?.phone,
        taxId: payload?.taxId,
        status: payload?.status,
      }),
    },
    onSessionUpdate,
  );
}

export function apiUpdateVendor(vendorId, payload, onSessionUpdate) {
  return authRequest(
    `/vendors/${vendorId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        vendorName: payload?.vendorName,
        companyName: payload?.companyName,
        email: payload?.email,
        phone: payload?.phone,
        taxId: payload?.taxId,
        status: payload?.status,
      }),
    },
    onSessionUpdate,
  );
}

export function apiDeleteVendor(vendorId, onSessionUpdate) {
  return authRequest(`/vendors/${vendorId}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListInvoices(query = {}, onSessionUpdate) {
  return authRequest(`/invoices${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetInvoiceById(invoiceId, onSessionUpdate) {
  return authRequest(`/invoices/${invoiceId}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateInvoice(payload, onSessionUpdate) {
  return authRequest(
    "/invoices",
    {
      method: "POST",
      body: JSON.stringify(sanitizeInvoicePayload(payload)),
    },
    onSessionUpdate,
  );
}

export function apiUpdateInvoice(invoiceId, payload, onSessionUpdate) {
  return authRequest(
    `/invoices/${invoiceId}`,
    {
      method: "PATCH",
      body: JSON.stringify(sanitizeInvoicePayload(payload)),
    },
    onSessionUpdate,
  );
}

export function apiDeleteInvoice(invoiceId, onSessionUpdate) {
  return authRequest(`/invoices/${invoiceId}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListInvoicePayments(invoiceId, onSessionUpdate) {
  return authRequest(`/invoices/${invoiceId}/payments`, { method: "GET" }, onSessionUpdate);
}

export function apiAddInvoicePayment(invoiceId, payload, onSessionUpdate) {
  return authRequest(
    `/invoices/${invoiceId}/payments`,
    { method: "POST", body: JSON.stringify(payload) },
    onSessionUpdate,
  );
}

export function apiDeleteInvoicePayment(invoiceId, paymentId, onSessionUpdate) {
  return authRequest(`/invoices/${invoiceId}/payments/${paymentId}`, { method: "DELETE" }, onSessionUpdate);
}

async function authBlobRequest(path, options = {}, onSessionUpdate) {
  if (!activeSession?.accessToken) {
    throw new Error("Not authenticated");
  }

  const attempt = async (token) => {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const networkErr = new Error("Backend server is not reachable. Please make sure backend is running.");
      networkErr.code = "BACKEND_UNREACHABLE";
      networkErr.cause = err;
      throw networkErr;
    }

    if (!response.ok) {
      const isJson = response.headers.get("content-type")?.includes("application/json");
      let message = `HTTP ${response.status}`;
      if (isJson) {
        try { message = (await response.json()).message || message; } catch (_) { /* ignore */ }
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return response.blob();
  };

  try {
    return await attempt(activeSession.accessToken);
  } catch (error) {
    if (error.status !== 401 || !activeSession?.refreshToken) throw error;

    const rotated = await refreshTokens(activeSession.refreshToken);
    const nextSession = { ...activeSession, accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
    activeSession = nextSession;
    if (typeof onSessionUpdate === "function") onSessionUpdate(nextSession);

    return attempt(nextSession.accessToken);
  }
}

export function apiDownloadInvoicePdf(invoiceId, onSessionUpdate) {
  return authBlobRequest(`/invoices/${invoiceId}/pdf`, { method: "GET" }, onSessionUpdate);
}

export function apiSendInvoiceEmail(invoiceId, onSessionUpdate) {
  return authRequest(`/invoices/${invoiceId}/send`, { method: "POST" }, onSessionUpdate);
}

export function apiListTeam(onSessionUpdate) {
  return authRequest("/team", { method: "GET" }, onSessionUpdate);
}

export function apiCreateTeamMember(payload, onSessionUpdate) {
  return authRequest(
    "/team",
    {
      method: "POST",
      body: JSON.stringify({
        email: payload?.email,
        fullName: payload?.fullName,
        role: payload?.role,
        password: payload?.password,
      }),
    },
    onSessionUpdate,
  );
}

export function apiUpdateTeamMember(memberId, payload, onSessionUpdate) {
  return authRequest(
    `/team/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        role: payload?.role,
        isActive: payload?.isActive,
      }),
    },
    onSessionUpdate,
  );
}

export function apiDeactivateTeamMember(memberId, onSessionUpdate) {
  return authRequest(`/team/${memberId}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListAccountingAccounts(query = {}, onSessionUpdate) {
  return authRequest(`/accounting/accounts${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateAccountingAccount(payload, onSessionUpdate) {
  return authRequest("/accounting/accounts", { method: "POST", body: JSON.stringify(payload) }, onSessionUpdate);
}

export function apiUpdateAccountingAccount(id, payload, onSessionUpdate) {
  return authRequest(`/accounting/accounts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, onSessionUpdate);
}

export function apiDeleteAccountingAccount(id, onSessionUpdate) {
  return authRequest(`/accounting/accounts/${id}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListJournalEntries(query = {}, onSessionUpdate) {
  return authRequest(`/accounting/journals${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetJournalEntry(id, onSessionUpdate) {
  return authRequest(`/accounting/journals/${id}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateJournalEntry(payload, onSessionUpdate) {
  return authRequest("/accounting/journals", { method: "POST", body: JSON.stringify(payload) }, onSessionUpdate);
}

export function apiUpdateJournalEntry(id, payload, onSessionUpdate) {
  return authRequest(`/accounting/journals/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, onSessionUpdate);
}

export function apiDeleteJournalEntry(id, onSessionUpdate) {
  return authRequest(`/accounting/journals/${id}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListBills(query = {}, onSessionUpdate) {
  return authRequest(`/bills${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiGetBill(id, onSessionUpdate) {
  return authRequest(`/bills/${id}`, { method: "GET" }, onSessionUpdate);
}

function sanitizeBillLinePayload(line = {}) {
  return {
    itemName: line.itemName,
    description: line.description,
    quantity: line.quantity,
    unitPriceMinor: line.unitPriceMinor,
    taxCode: line.taxCode,
    taxRate: line.taxRate,
  };
}

function sanitizeBillPayload(payload = {}) {
  return {
    vendorId: payload.vendorId,
    billNumber: payload.billNumber,
    status: payload.status,
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    currency: payload.currency,
    notes: payload.notes,
    ...(Array.isArray(payload.lines)
      ? { lines: payload.lines.map((line) => sanitizeBillLinePayload(line)) }
      : {}),
  };
}

export function apiCreateBill(payload, onSessionUpdate) {
  return authRequest("/bills", {
    method: "POST",
    body: JSON.stringify(sanitizeBillPayload(payload)),
  }, onSessionUpdate);
}

export function apiUpdateBill(id, payload, onSessionUpdate) {
  return authRequest(`/bills/${id}`, {
    method: "PATCH",
    body: JSON.stringify(sanitizeBillPayload(payload)),
  }, onSessionUpdate);
}

export function apiDeleteBill(id, onSessionUpdate) {
  return authRequest(`/bills/${id}`, { method: "DELETE" }, onSessionUpdate);
}

// Banking API functions
export function apiListBankAccounts(query = {}, onSessionUpdate) {
  return authRequest(`/banking/accounts${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateBankAccount(payload, onSessionUpdate) {
  return authRequest("/banking/accounts", {
    method: "POST",
    body: JSON.stringify(payload)
  }, onSessionUpdate);
}

export function apiUpdateBankAccount(id, payload, onSessionUpdate) {
  return authRequest(`/banking/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }, onSessionUpdate);
}

export function apiDeleteBankAccount(id, onSessionUpdate) {
  return authRequest(`/banking/accounts/${id}`, { method: "DELETE" }, onSessionUpdate);
}

export function apiListBankTransactions(query = {}, onSessionUpdate) {
  return authRequest(`/banking/transactions${buildQueryString(query)}`, { method: "GET" }, onSessionUpdate);
}

export function apiCreateBankTransaction(payload, onSessionUpdate) {
  return authRequest("/banking/transactions", {
    method: "POST",
    body: JSON.stringify(payload)
  }, onSessionUpdate);
}

export function apiDeleteBankTransaction(id, onSessionUpdate) {
  return authRequest(`/banking/transactions/${id}`, { method: "DELETE" }, onSessionUpdate);
}

// Reports API functions
export function apiGetTrialBalance(onSessionUpdate) {
  return authRequest("/reports/trial-balance", { method: "GET" }, onSessionUpdate);
}

export function apiGetProfitLoss(onSessionUpdate) {
  return authRequest("/reports/profit-loss", { method: "GET" }, onSessionUpdate);
}

export function apiGetBalanceSheet(onSessionUpdate) {
  return authRequest("/reports/balance-sheet", { method: "GET" }, onSessionUpdate);
}

export function apiGetCashFlow(onSessionUpdate) {
  return authRequest("/reports/cash-flow", { method: "GET" }, onSessionUpdate);
}
