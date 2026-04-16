export const STORAGE_KEY = "tetavio-erp-data-v4";

export function createSeedData() {
  return {
    settings: {
      companyName: "Tetavio ERP",
      taxId: "AZ-4582019",
      mobilePhone: "",
      entityType: "Hüquqi şəxs",
      currency: "AZN",
      fiscalYear: "2026",
      invoicePrefix: "INV",
      quotePrefix: "TEK",
      defaultPaymentTerm: "30 gün",
      defaultTaxLabel: "ƏDV 18%",
      numberingMode: "Avtomatik",
      stockWarning: "Bəli",
      negativeStock: "Xeyr",
      autoBackup: "Bəli",
      discountMode: "Sənəd səviyyəsində",
      discountTiming: "Vergidən əvvəl endirim",
      additionalAdjustment: "Bəli",
      shippingCharge: "Bəli",
      shippingTaxAutomation: "Xeyr",
      taxMode: "Vergi xaric",
      roundOffTaxMode: "Sənəd səviyyəsində",
      salesRoundingMode: "Yuvarlaqlaşdırma yoxdur",
      salespersonField: "Bəli",
      uiScale: "Avtomatik"
    },
    items: [
      { id: "seed-item-1", name: "Daşıma koordinasiyası", sku: "SERV-001", type: "Xidmət", rate: 450, purchaseRate: 0, stockOnHand: 0, usageUnit: "xidmət", salesDescription: "Şəhərdaxili və regional daşıma koordinasiyası", purchaseDescription: "Subpodrat logistika xidməti", salesAccount: "Xidmət gəlirləri", purchaseAccount: "Subpodrat xərcləri", salesTax: "ƏDV 18%", purchaseTax: "ƏDV 18%", trackInventory: "Xeyr", reorderPoint: 0, preferredVendor: "Transit Partners", enableSalesInfo: "Bəli", enablePurchaseInfo: "Bəli" },
      { id: "seed-item-2", name: "Anbar xidməti", sku: "SERV-002", type: "Xidmət", rate: 120, purchaseRate: 0, stockOnHand: 0, usageUnit: "gün", salesDescription: "Günlük anbar saxlama xidməti", purchaseDescription: "3PL depo xidməti", salesAccount: "Anbar gəlirləri", purchaseAccount: "Anbar xərcləri", salesTax: "ƏDV 18%", purchaseTax: "ƏDV 18%", trackInventory: "Xeyr", reorderPoint: 0, preferredVendor: "Baku Storage Hub", enableSalesInfo: "Bəli", enablePurchaseInfo: "Bəli" },
      { id: "seed-item-3", name: "Qablaşdırma materialları", sku: "ITEM-003", type: "Anbar malı", rate: 35, purchaseRate: 22, stockOnHand: 280, usageUnit: "ədəd", salesDescription: "Satışa hazır qablaşdırma dəsti", purchaseDescription: "Topdan qablaşdırma materialı alışı", salesAccount: "Mal satışı gəlirləri", purchaseAccount: "Satılan malın maya dəyəri", salesTax: "ƏDV 18%", purchaseTax: "ƏDV 18%", trackInventory: "Bəli", reorderPoint: 120, preferredVendor: "OfficeHub", enableSalesInfo: "Bəli", enablePurchaseInfo: "Bəli" }
    ],
    itemMovements: [
      { id: crypto.randomUUID(), itemId: "seed-item-3", itemName: "Qablaşdırma materialları", movementType: "Alış", quantity: 80, unitPrice: 22, partner: "OfficeHub", movementDate: "2026-04-04", note: "Anbar ehtiyatı tamamlanıb", amount: 1760 },
      { id: crypto.randomUUID(), itemId: "seed-item-3", itemName: "Qablaşdırma materialları", movementType: "Satış", quantity: 25, unitPrice: 35, partner: "Atlas Cargo", movementDate: "2026-04-08", note: "Müştəri sifarişi", amount: 875 }
    ],
    customers: [
      { id: crypto.randomUUID(), displayName: "Atlas Cargo", companyName: "Atlas Cargo MMC", email: "ops@atlascargo.com", outstandingReceivables: 4250 },
      { id: crypto.randomUUID(), displayName: "BlueBay Trade", companyName: "BlueBay Trade LTD", email: "finance@bluebaytrade.com", outstandingReceivables: 2180 },
      { id: crypto.randomUUID(), displayName: "Metro Retail", companyName: "Metro Retail Group", email: "payables@metroretail.com", outstandingReceivables: 980 }
    ],
    quotes: [
      { id: crypto.randomUUID(), quoteNumber: "Q-2026-004", customerName: "Atlas Cargo", status: "Göndərilib", validUntil: "2026-04-15", amount: 3800 },
      { id: crypto.randomUUID(), quoteNumber: "Q-2026-005", customerName: "Metro Retail", status: "Qaralama", validUntil: "2026-04-19", amount: 1260 }
    ],
    invoices: [
      { id: crypto.randomUUID(), invoiceNumber: "INV-2026-021", customerName: "Atlas Cargo", status: "Ödənilib", dueDate: "2026-04-05", amount: 6200 },
      { id: crypto.randomUUID(), invoiceNumber: "INV-2026-022", customerName: "BlueBay Trade", status: "Göndərilib", dueDate: "2026-04-10", amount: 2180 },
      { id: crypto.randomUUID(), invoiceNumber: "INV-2026-023", customerName: "Metro Retail", status: "Gecikib", dueDate: "2026-04-02", amount: 980 }
    ],
    salesReceipts: [
      { id: crypto.randomUUID(), receiptNumber: "SR-2026-001", customerName: "Birbaşa müştəri", paymentMode: "Nağd", date: "2026-04-06", amount: 340 },
      { id: crypto.randomUUID(), receiptNumber: "SR-2026-002", customerName: "Atlas Cargo", paymentMode: "Bank köçürməsi", date: "2026-04-07", amount: 1250 }
    ],
    recurringInvoices: [
      { id: crypto.randomUUID(), profileName: "Aylıq saxlama xidməti", customerName: "BlueBay Trade", frequency: "Aylıq", nextRunDate: "2026-05-01", amount: 890 },
      { id: crypto.randomUUID(), profileName: "Həftəlik dispatch xidməti", customerName: "Metro Retail", frequency: "Həftəlik", nextRunDate: "2026-04-12", amount: 420 }
    ],
    paymentsReceived: [
      { id: crypto.randomUUID(), paymentNumber: "PAY-2026-011", customerName: "Atlas Cargo", invoiceRef: "INV-2026-021", date: "2026-04-05", paymentMode: "Bank köçürməsi", amount: 6200 },
      { id: crypto.randomUUID(), paymentNumber: "PAY-2026-012", customerName: "BlueBay Trade", invoiceRef: "INV-2026-022", date: "2026-04-09", paymentMode: "Kart", amount: 1000 }
    ],
    creditNotes: [
      { id: crypto.randomUUID(), creditNumber: "CN-2026-001", customerName: "Metro Retail", invoiceRef: "INV-2026-023", date: "2026-04-03", status: "Açıq", amount: 120 },
      { id: crypto.randomUUID(), creditNumber: "CN-2026-002", customerName: "Atlas Cargo", invoiceRef: "INV-2026-021", date: "2026-04-06", status: "Tətbiq edilib", amount: 60 }
    ],
    vendors: [
      { id: crypto.randomUUID(), vendorName: "FuelNet", companyName: "FuelNet Services", email: "billing@fuelnet.com", outstandingPayables: 740 },
      { id: crypto.randomUUID(), vendorName: "OfficeHub", companyName: "OfficeHub Supplies", email: "ar@officehub.com", outstandingPayables: 210 },
      { id: crypto.randomUUID(), vendorName: "CloudLedger", companyName: "CloudLedger Software", email: "accounts@cloudledger.io", outstandingPayables: 540 }
    ],
    goods: [],
    incomingGoodsServices: [],
    expenses: [
      { id: crypto.randomUUID(), expenseNumber: "EXP-2026-031", vendorName: "FuelNet", category: "Yanacaq", date: "2026-04-07", paymentMode: "Kart", amount: 740 },
      { id: crypto.randomUUID(), expenseNumber: "EXP-2026-032", vendorName: "OfficeHub", category: "Ofis ləvazimatları", date: "2026-04-06", paymentMode: "Nağd", amount: 120 },
      { id: crypto.randomUUID(), expenseNumber: "EXP-2026-033", vendorName: "CloudLedger", category: "Proqram təminatı", date: "2026-04-08", paymentMode: "Bank köçürməsi", amount: 225 }
    ],
    bills: [
      { id: crypto.randomUUID(), billNumber: "BILL-2026-018", vendorName: "FuelNet", status: "Açıq", dueDate: "2026-04-11", amount: 740 },
      { id: crypto.randomUUID(), billNumber: "BILL-2026-019", vendorName: "CloudLedger", status: "Qismən ödənilib", dueDate: "2026-04-14", amount: 540 }
    ],
    bankingAccounts: [
      { id: crypto.randomUUID(), accountName: "Main Operating Account", institution: "Kapital Bank", accountType: "Current", balance: 18450, lastSync: "2026-04-08" },
      { id: crypto.randomUUID(), accountName: "Expense Card", institution: "PASHA Bank", accountType: "Card", balance: 2860, lastSync: "2026-04-08" }
    ],
    bankTransactions: [
      { id: crypto.randomUUID(), date: "2026-04-08", description: "Inflow from Atlas Cargo", category: "Payment Received", transactionType: "Credit", amount: 3200 },
      { id: crypto.randomUUID(), date: "2026-04-07", description: "Fuel station payment", category: "Expense", transactionType: "Debit", amount: 220 },
      { id: crypto.randomUUID(), date: "2026-04-06", description: "Office rent payment", category: "Bill Payment", transactionType: "Debit", amount: 1200 }
    ],
    manualJournals: [
      { id: crypto.randomUUID(), journalNumber: "MJ-2026-001", reference: "Month-end accrual", date: "2026-04-01", debit: 900, credit: 900 },
      { id: crypto.randomUUID(), journalNumber: "MJ-2026-002", reference: "Prepaid expense adjustment", date: "2026-04-04", debit: 250, credit: 250 }
    ],
    chartOfAccounts: [
      { id: crypto.randomUUID(), accountCode: "111", accountName: "Cash on hand", accountType: "Aktiv", status: "Aktiv", balance: 1500 },
      { id: crypto.randomUUID(), accountCode: "201", accountName: "Inventories", accountType: "Aktiv", status: "Aktiv", balance: 4200 },
      { id: crypto.randomUUID(), accountCode: "231", accountName: "Accounts receivable from customers", accountType: "Aktiv", status: "Aktiv", balance: 7410 },
      { id: crypto.randomUUID(), accountCode: "241", accountName: "Recoverable VAT", accountType: "Aktiv", status: "Aktiv", balance: 890 },
      { id: crypto.randomUUID(), accountCode: "311", accountName: "Bank accounts", accountType: "Aktiv", status: "Aktiv", balance: 18450 },
      { id: crypto.randomUUID(), accountCode: "521", accountName: "VAT liability", accountType: "Öhdəlik", status: "Aktiv", balance: 620 },
      { id: crypto.randomUUID(), accountCode: "531", accountName: "Accounts payable to suppliers", accountType: "Öhdəlik", status: "Aktiv", balance: 1490 },
      { id: crypto.randomUUID(), accountCode: "601", accountName: "Service revenue", accountType: "Gəlir", status: "Aktiv", balance: 8360 },
      { id: crypto.randomUUID(), accountCode: "701", accountName: "Cost of goods sold", accountType: "Xərc", status: "Aktiv", balance: 3180 },
      { id: crypto.randomUUID(), accountCode: "712", accountName: "Administrative expenses", accountType: "Xərc", status: "Aktiv", balance: 1240 }
    ],
    reports: [
      { id: crypto.randomUUID(), name: "Mənfəət və zərər", amount: 4975, description: "Cari dövr üzrə gəlir və xərclərin fərqi." },
      { id: crypto.randomUUID(), name: "Balans hesabatı", amount: 24370, description: "Aktiv, öhdəlik və kapitalın anlıq vəziyyəti." },
      { id: crypto.randomUUID(), name: "Pul axını", amount: 5155, description: "Əməliyyatlar və ödənişlər üzrə xalis pul hərəkəti." }
    ],
    documents: [
      { id: crypto.randomUUID(), title: "Atlas Cargo əsas müqaviləsi", relatedTo: "Müştəri / Atlas Cargo", category: "Müqavilə", updatedAt: "2026-04-02" },
      { id: crypto.randomUUID(), title: "FuelNet aprel hesabı", relatedTo: "Təchizatçı / FuelNet", category: "Hesab əlavəsi", updatedAt: "2026-04-06" },
      { id: crypto.randomUUID(), title: "INV-2026-022 PDF", relatedTo: "Faktura / INV-2026-022", category: "Faktura", updatedAt: "2026-04-07" }
    ]
  };
}

export function createResetData() {
  const seed = createSeedData();

  return {
    ...seed,
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
    chartOfAccounts: seed.chartOfAccounts.map((account) => ({
      ...account,
      balance: 0
    })),
    reports: seed.reports.map((report) => ({
      ...report,
      amount: 0
    })),
    documents: []
  };
}

export function currency(value, code) {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: code || "AZN"
  }).format(Number(value || 0));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
