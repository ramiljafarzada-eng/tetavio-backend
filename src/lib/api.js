const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

let activeSession = null;

export function setApiSession(session) {
  activeSession = session || null;
}

function unwrapEnvelope(payload) {
  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success) return payload.data;
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

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

export function apiLogout(refreshToken) {
  return apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
