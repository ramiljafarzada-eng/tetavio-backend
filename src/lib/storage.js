import { createSeedData, STORAGE_KEY, today } from "./data";

const numberFields = new Set([
  "serialNumber",
  "rate",
  "price",
  "purchaseRate",
  "stockOnHand",
  "quantity",
  "unitPrice",
  "reorderPoint",
  "vatAmount",
  "totalAmount",
  "taxRate",
  "taxAmount",
  "baseAmount",
  "costAmount",
  "outstandingReceivables",
  "outstandingPayables",
  "amount",
  "debit",
  "credit",
  "balance",
  "discount",
  "adjustment",
  "subTotal",
  "discountAmount"
]);

function createId(prefix, index) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${index + 1}`;
}

function asNumber(value) {
  return Number(value || 0);
}

function extractTaxRate(label) {
  const match = String(label || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function mergeMissingAccounts(existing, seedAccounts) {
  const seenCodes = new Set(existing.map((account) => account.accountCode));
  return [...existing, ...seedAccounts.filter((account) => !seenCodes.has(account.accountCode))];
}

const REQUIRED_ACCOUNTS = [
  { accountCode: "101", accountName: "Intangible assets", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "111", accountName: "Property, plant and equipment", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "113", accountName: "Investment property", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "131", accountName: "Long-term financial investments", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "141", accountName: "Long-term receivables", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "201", accountName: "Inventories", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "205", accountName: "Goods purchased", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "211", accountName: "Short-term receivables", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "221", accountName: "Cash on hand", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "223", accountName: "Bank settlement accounts", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "224", accountName: "Foreign currency accounts", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "225", accountName: "Cash equivalents", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "231", accountName: "Accounts receivable from customers", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "233", accountName: "Short-term advances paid", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "241", accountName: "Recoverable VAT", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "243", accountName: "Other tax receivables", accountType: "Aktiv", status: "Aktiv", balance: 0 },
  { accountCode: "301", accountName: "Share capital", accountType: "Kapital", status: "Aktiv", balance: 0 },
  { accountCode: "311", accountName: "Share premium", accountType: "Kapital", status: "Aktiv", balance: 0 },
  { accountCode: "341", accountName: "Retained earnings", accountType: "Kapital", status: "Aktiv", balance: 0 },
  { accountCode: "411", accountName: "Long-term bank loans", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "421", accountName: "Long-term borrowings", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "511", accountName: "Short-term bank loans", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "521", accountName: "Tax and statutory liabilities", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "522", accountName: "Social security and insurance liabilities", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "531", accountName: "Short-term accounts payable to suppliers", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "541", accountName: "Short-term advances received", accountType: "Öhdəlik", status: "Aktiv", balance: 0 },
  { accountCode: "601", accountName: "Sales revenue", accountType: "Gəlir", status: "Aktiv", balance: 0 },
  { accountCode: "611", accountName: "Other operating income", accountType: "Gəlir", status: "Aktiv", balance: 0 },
  { accountCode: "621", accountName: "Financial income", accountType: "Gəlir", status: "Aktiv", balance: 0 },
  { accountCode: "631", accountName: "Other income", accountType: "Gəlir", status: "Aktiv", balance: 0 },
  { accountCode: "701", accountName: "Cost of goods sold", accountType: "Xərc", status: "Aktiv", balance: 0 },
  { accountCode: "711", accountName: "Selling expenses", accountType: "Xərc", status: "Aktiv", balance: 0 },
  { accountCode: "712", accountName: "Administrative expenses", accountType: "Xərc", status: "Aktiv", balance: 0 },
  { accountCode: "721", accountName: "Financial expenses", accountType: "Xərc", status: "Aktiv", balance: 0 },
  { accountCode: "731", accountName: "Other operating expenses", accountType: "Xərc", status: "Aktiv", balance: 0 },
  { accountCode: "801", accountName: "Profit or loss", accountType: "Kapital", status: "Aktiv", balance: 0 },
  { accountCode: "901", accountName: "Income tax", accountType: "Xərc", status: "Aktiv", balance: 0 }
];

function normalizeList(value, fallback, mapItem) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map(mapItem).filter(Boolean);
}

function normalizeRecord(prefix, index, item, template, aliasMap = {}) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const normalized = { ...template };

  Object.keys(template).forEach((key) => {
    const sourceKey = aliasMap[key] || key;
    const sourceValue = item[key] ?? item[sourceKey];

    if (sourceValue !== undefined) {
      normalized[key] = numberFields.has(key) ? asNumber(sourceValue) : sourceValue;
    }
  });

  normalized.id = item.id || createId(prefix, index);
  return normalized;
}

function normalizeState(raw) {
  const seed = createSeedData();
  const source = raw && typeof raw === "object" ? raw : {};

  const settings = {
    ...seed.settings,
    ...(source.settings && typeof source.settings === "object" ? source.settings : {})
  };
  const items = normalizeList(source.items, seed.items, (item, index) =>
    normalizeRecord("item", index, item, seed.items[0])
  );
  const itemLookup = new Map(items.map((item) => [item.id, item]));
  const itemMovements = normalizeList(source.itemMovements, seed.itemMovements, (item, index) => {
    const normalized = normalizeRecord("item-movement", index, item, seed.itemMovements[0], {
      movementDate: "date",
      movementType: "type"
    });
    if (!normalized) return null;

    const linkedItem = itemLookup.get(normalized.itemId);
    const fallbackTaxLabel = normalized.movementType === "Satış"
      ? settings.defaultTaxLabel
      : linkedItem?.purchaseTax || "ƏDV 18%";
    const resolvedTaxLabel = normalized.taxLabel || fallbackTaxLabel;
    const resolvedTaxRate = normalized.taxRate || extractTaxRate(resolvedTaxLabel);
    const baseAmount = normalized.baseAmount || normalized.quantity * normalized.unitPrice;
    const taxAmount = normalized.taxAmount || (resolvedTaxRate > 0 ? Number((baseAmount * (resolvedTaxRate / 100)).toFixed(2)) : 0);
    const totalAmount = normalized.amount || Number((baseAmount + taxAmount).toFixed(2));

    return {
      ...normalized,
      itemType: normalized.itemType || linkedItem?.type || "Xidmət",
      taxLabel: resolvedTaxLabel,
      taxRate: resolvedTaxRate,
      baseAmount,
      taxAmount,
      costAmount: normalized.costAmount || (normalized.movementType === "Satış" && linkedItem?.type !== "Xidmət" ? Number((normalized.quantity * Number(linkedItem?.purchaseRate || 0)).toFixed(2)) : 0),
      amount: totalAmount
    };
  });
  const chartOfAccounts = mergeMissingAccounts(
    normalizeList(source.chartOfAccounts, seed.chartOfAccounts, (item, index) =>
      normalizeRecord("account", index, item, seed.chartOfAccounts[0])
    ),
    [...seed.chartOfAccounts, ...REQUIRED_ACCOUNTS.map((account, index) => ({ id: createId("required-account", index), ...account }))]
  );

  return {
    ...seed,
    ...source,
    settings,
    items,
    hubLang: source.hubLang || "en",
    activeSection: source.activeSection || "home",
    activeModule: source.activeModule || null,
    itemMovements,
    customers: normalizeList(source.customers, seed.customers, (item, index) =>
      normalizeRecord("customer", index, item, seed.customers[0], {
        displayName: "name",
        companyName: "company",
        outstandingReceivables: "balance"
      })
    ),
    quotes: normalizeList(source.quotes, seed.quotes, (item, index) =>
      normalizeRecord("quote", index, item, seed.quotes[0])
    ),
    invoices: normalizeList(source.invoices, seed.invoices, (item, index) =>
      normalizeRecord("invoice", index, item, seed.invoices[0], {
        invoiceNumber: "number",
        customerName: "customer",
        dueDate: "date"
      })
    ),
    salesReceipts: normalizeList(source.salesReceipts, seed.salesReceipts, (item, index) =>
      normalizeRecord("receipt", index, item, seed.salesReceipts[0])
    ),
    recurringInvoices: normalizeList(source.recurringInvoices, seed.recurringInvoices, (item, index) =>
      normalizeRecord("recurring", index, item, seed.recurringInvoices[0])
    ),
    paymentsReceived: normalizeList(source.paymentsReceived, seed.paymentsReceived, (item, index) =>
      normalizeRecord("payment", index, item, seed.paymentsReceived[0], {
        date: "paymentDate"
      })
    ),
    creditNotes: normalizeList(source.creditNotes, seed.creditNotes, (item, index) =>
      normalizeRecord("credit", index, item, seed.creditNotes[0], {
        date: "creditDate"
      })
    ),
    vendors: normalizeList(source.vendors, seed.vendors, (item, index) =>
      normalizeRecord("vendor", index, item, seed.vendors[0])
    ),
    goods: normalizeList(source.goods, seed.goods, (item, index) =>
      normalizeRecord("good", index, item, {
        id: "",
        name: "",
        type: "Mal",
        unit: "",
        code: ""
      })
    ),
    incomingGoodsServices: normalizeList(source.incomingGoodsServices, seed.incomingGoodsServices, (item, index) => {
      const normalized = normalizeRecord("incoming-goods-service", index, item, {
        id: "",
        billNumber: "",
        billDate: "",
        vendorName: "",
        notes: "",
        discount: 0,
        adjustment: 0,
        subTotal: 0,
        discountAmount: 0,
        totalAmount: 0
      });
      if (normalized) {
        normalized.lineItems = Array.isArray(item.lineItems) ? item.lineItems : [];
      }
      return normalized;
    }),
    expenses: normalizeList(source.expenses, seed.expenses, (item, index) =>
      normalizeRecord("expense", index, item, seed.expenses[0], {
        vendorName: "description",
        paymentMode: "method",
        date: "expenseDate"
      })
    ),
    bills: normalizeList(source.bills, seed.bills, (item, index) =>
      normalizeRecord("bill", index, item, seed.bills[0])
    ),
    bankingAccounts: normalizeList(source.bankingAccounts, seed.bankingAccounts, (item, index) =>
      normalizeRecord("bank-account", index, item, seed.bankingAccounts[0])
    ),
    bankTransactions: normalizeList(source.bankTransactions, seed.bankTransactions, (item, index) =>
      normalizeRecord("bank-tx", index, item, seed.bankTransactions[0])
    ),
    manualJournals: normalizeList(source.manualJournals, seed.manualJournals, (item, index) => {
      const normalized = normalizeRecord("journal", index, item, seed.manualJournals[0]);
      if (normalized) {
        normalized.journalLines = Array.isArray(item.journalLines)
          ? item.journalLines.map((line, lineIndex) => ({
              id: line?.id || createId(`journal-line-${index + 1}`, lineIndex),
              accountCode: line?.accountCode || "",
              entryType: line?.entryType || "Debet",
              amount: asNumber(line?.amount),
              linkedQuantity: asNumber(line?.linkedQuantity),
              linkedUnit: line?.linkedUnit || "",
              subledgerCategory: line?.subledgerCategory || "",
              linkedEntityType: line?.linkedEntityType || "",
              linkedEntityId: line?.linkedEntityId || "",
              linkedEntityName: line?.linkedEntityName || ""
            }))
          : [];
        if (item.autoCloseType) normalized.autoCloseType = item.autoCloseType;
        if (item.autoCloseKey) normalized.autoCloseKey = item.autoCloseKey;
        if (item.autoGenerated) normalized.autoGenerated = item.autoGenerated;
        if (item.notes) normalized.notes = item.notes;
        if (item.debitAccount !== undefined) normalized.debitAccount = item.debitAccount;
        if (item.creditAccount !== undefined) normalized.creditAccount = item.creditAccount;
      }
      return normalized;
    }),
    chartOfAccounts,
    reports: normalizeList(source.reports, seed.reports, (item, index) =>
      normalizeRecord("report", index, item, seed.reports[0])
    ),
    documents: normalizeList(source.documents, seed.documents, (item, index) =>
      normalizeRecord("document", index, item, seed.documents[0])
    ),
    migratedAt: source.migratedAt || today()
  };
}

export function normalizeAppState(raw) {
  return normalizeState(raw);
}

async function getInvoke() {
  if (window.__TAURI__?.core?.invoke) {
    return window.__TAURI__.core.invoke;
  }

  if (window.__TAURI_INTERNALS__?.invoke) {
    return window.__TAURI_INTERNALS__.invoke;
  }

  return null;
}

function getUserKey(userEmail) {
  if (!userEmail) return STORAGE_KEY;
  return `${STORAGE_KEY}-${encodeURIComponent(String(userEmail).trim().toLowerCase())}`;
}

// Bütün bu istifadəçiyə aid açarları sil (köhnə default açar da daxil)
export function clearAppState(userEmail) {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  if (userEmail) {
    try { localStorage.removeItem(getUserKey(userEmail)); } catch { /* ignore */ }
  }
}

const EMPTY_STATE = null; // normalizeState(EMPTY_STATE) → seed fallback-lar olmadan boş state

function emptyState() {
  // Seed fallback-lardan istifadə etmədən tamamilə boş state
  const seed = createSeedData();
  return {
    settings: seed.settings,
    items: [],
    itemMovements: [],
    customers: [],
    quotes: [],
    invoices: [],
    salesReceipts: [],
    recurringInvoices: [],
    paymentsReceived: [],
    creditNotes: [],
    vendors: [],
    goods: [],
    incomingGoodsServices: [],
    expenses: [],
    bills: [],
    bankingAccounts: [],
    bankTransactions: [],
    manualJournals: [],
    chartOfAccounts: [],
    reports: seed.reports.map((r) => ({ ...r, amount: 0 })),
    documents: [],
    hubLang: "en",
    activeSection: "home",
    activeModule: null,
    migratedAt: ""
  };
}

export async function loadAppState(userEmail) {
  const invoke = await getInvoke();

  if (invoke) {
    try {
      // Tauri: orijinal imzanı saxla, userEmail göndərmə
      const state = await invoke("load_app_state");
      return normalizeState(state);
    } catch {
      return loadBrowserState(userEmail);
    }
  }

  return loadBrowserState(userEmail);
}

export async function saveAppState(state, userEmail) {
  const normalized = normalizeState(state);
  const invoke = await getInvoke();

  if (invoke) {
    try {
      // Tauri: orijinal imzanı saxla, userEmail göndərmə
      await invoke("save_app_state", { state: normalized });
      return;
    } catch {
      saveBrowserState(normalized, userEmail);
      return;
    }
  }

  saveBrowserState(normalized, userEmail);
}

function loadBrowserState(userEmail) {
  const key = getUserKey(userEmail);
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return normalizeState(JSON.parse(saved));
    } catch { /* ignore */ }
  }

  // Heç nə tapılmadı — tamamilə boş state qaytar (seed demo data yox)
  return normalizeState(emptyState());
}

function saveBrowserState(state, userEmail) {
  const key = getUserKey(userEmail);
  localStorage.setItem(key, JSON.stringify(state));
}
