import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AgingBucket =
  | 'CURRENT'
  | 'DAYS_1_30'
  | 'DAYS_31_60'
  | 'DAYS_61_90'
  | 'DAYS_90_PLUS'
  | 'NO_DUE_DATE';

function daysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));
}

function classifyBucket(dueDate: Date | null, today: Date): AgingBucket {
  if (!dueDate) return 'NO_DUE_DATE';
  const overdue = daysBetween(dueDate, today);
  if (overdue <= 0) return 'CURRENT';
  if (overdue <= 30) return 'DAYS_1_30';
  if (overdue <= 60) return 'DAYS_31_60';
  if (overdue <= 90) return 'DAYS_61_90';
  return 'DAYS_90_PLUS';
}

const BUCKET_LABELS: Record<AgingBucket, string> = {
  CURRENT: 'Current',
  DAYS_1_30: '1–30 Days',
  DAYS_31_60: '31–60 Days',
  DAYS_61_90: '61–90 Days',
  DAYS_90_PLUS: '90+ Days',
  NO_DUE_DATE: 'No Due Date',
};

const BUCKET_ORDER: AgingBucket[] = [
  'CURRENT',
  'DAYS_1_30',
  'DAYS_31_60',
  'DAYS_61_90',
  'DAYS_90_PLUS',
  'NO_DUE_DATE',
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountsReceivableAging(accountId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rawInvoices = await this.prisma.invoice.findMany({
      where: { accountId, deletedAt: null },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalMinor: true,
        dueDate: true,
        customer: {
          select: { id: true, displayName: true, companyName: true },
        },
        payments: {
          where: { deletedAt: null },
          select: { amountMinor: true },
        },
      },
    });

    // Compute outstanding, filter out fully-paid invoices
    const unpaidInvoices = rawInvoices
      .map((inv) => {
        const paidAmountMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
        const outstandingMinor = inv.totalMinor - paidAmountMinor;
        return { ...inv, paidAmountMinor, outstandingMinor };
      })
      .filter((inv) => inv.outstandingMinor > 0)
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return b.outstandingMinor - a.outstandingMinor;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return diff !== 0 ? diff : b.outstandingMinor - a.outstandingMinor;
      });

    // Build invoice rows with bucket classification
    const invoiceRows = unpaidInvoices.map((inv) => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const bucket = classifyBucket(dueDate, today);
      const daysOverdue = dueDate ? Math.max(0, daysBetween(dueDate, today)) : 0;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customer.id,
        customerName: inv.customer.displayName || inv.customer.companyName || '—',
        dueDate: inv.dueDate,
        totalMinor: inv.totalMinor,
        paidAmountMinor: inv.paidAmountMinor,
        outstandingMinor: inv.outstandingMinor,
        status: inv.status,
        daysOverdue,
        bucket,
      };
    });

    // Aggregate per customer
    type CustomerRow = {
      customerId: string;
      customerName: string;
      totalOutstandingMinor: number;
      currentMinor: number;
      days1To30Minor: number;
      days31To60Minor: number;
      days61To90Minor: number;
      days90PlusMinor: number;
      noDueDateMinor: number;
      invoiceCount: number;
      oldestDueDate: string | null;
    };

    const customerMap = new Map<string, CustomerRow>();

    for (const inv of invoiceRows) {
      const row: CustomerRow = customerMap.get(inv.customerId) ?? {
        customerId: inv.customerId,
        customerName: inv.customerName,
        totalOutstandingMinor: 0,
        currentMinor: 0,
        days1To30Minor: 0,
        days31To60Minor: 0,
        days61To90Minor: 0,
        days90PlusMinor: 0,
        noDueDateMinor: 0,
        invoiceCount: 0,
        oldestDueDate: null,
      };

      row.totalOutstandingMinor += inv.outstandingMinor;
      row.invoiceCount += 1;

      switch (inv.bucket) {
        case 'CURRENT':     row.currentMinor     += inv.outstandingMinor; break;
        case 'DAYS_1_30':   row.days1To30Minor   += inv.outstandingMinor; break;
        case 'DAYS_31_60':  row.days31To60Minor  += inv.outstandingMinor; break;
        case 'DAYS_61_90':  row.days61To90Minor  += inv.outstandingMinor; break;
        case 'DAYS_90_PLUS':row.days90PlusMinor  += inv.outstandingMinor; break;
        case 'NO_DUE_DATE': row.noDueDateMinor   += inv.outstandingMinor; break;
      }

      if (inv.dueDate) {
        const ddStr = new Date(inv.dueDate).toISOString();
        if (!row.oldestDueDate || ddStr < row.oldestDueDate) {
          row.oldestDueDate = ddStr;
        }
      }

      customerMap.set(inv.customerId, row);
    }

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalOutstandingMinor - a.totalOutstandingMinor,
    );

    // Summary totals
    const bucketTotals: Record<AgingBucket, { amountMinor: number; invoiceCount: number }> = {
      CURRENT:      { amountMinor: 0, invoiceCount: 0 },
      DAYS_1_30:    { amountMinor: 0, invoiceCount: 0 },
      DAYS_31_60:   { amountMinor: 0, invoiceCount: 0 },
      DAYS_61_90:   { amountMinor: 0, invoiceCount: 0 },
      DAYS_90_PLUS: { amountMinor: 0, invoiceCount: 0 },
      NO_DUE_DATE:  { amountMinor: 0, invoiceCount: 0 },
    };

    for (const inv of invoiceRows) {
      bucketTotals[inv.bucket].amountMinor += inv.outstandingMinor;
      bucketTotals[inv.bucket].invoiceCount += 1;
    }

    const totalOutstandingMinor = invoiceRows.reduce((s, i) => s + i.outstandingMinor, 0);

    const summary = {
      totalOutstandingMinor,
      currentMinor:    bucketTotals.CURRENT.amountMinor,
      days1To30Minor:  bucketTotals.DAYS_1_30.amountMinor,
      days31To60Minor: bucketTotals.DAYS_31_60.amountMinor,
      days61To90Minor: bucketTotals.DAYS_61_90.amountMinor,
      days90PlusMinor: bucketTotals.DAYS_90_PLUS.amountMinor,
      noDueDateMinor:  bucketTotals.NO_DUE_DATE.amountMinor,
      invoiceCount:    invoiceRows.length,
      customerCount:   customerMap.size,
    };

    const buckets = BUCKET_ORDER.map((key) => ({
      key,
      label: BUCKET_LABELS[key],
      amountMinor: bucketTotals[key].amountMinor,
      invoiceCount: bucketTotals[key].invoiceCount,
    }));

    return {
      asOfDate: today.toISOString(),
      summary,
      buckets,
      customers,
      invoices: invoiceRows,
    };
  }

  // ─── Trial Balance ──────────────────────────────────────────────────────────

  async getTrialBalance(accountId: string) {
    const today = new Date();

    // Single query: all lines from non-deleted journal entries for this account
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: { accountId, deletedAt: null },
      },
      select: {
        debitMinor: true,
        creditMinor: true,
        accountingAccount: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
    });

    // In-memory aggregation by accounting account
    const accountMap = new Map<string, {
      accountCode: string;
      accountName: string;
      accountType: string;
      totalDebitMinor: number;
      totalCreditMinor: number;
    }>();

    for (const line of lines) {
      const acc = line.accountingAccount;
      const existing = accountMap.get(acc.id) ?? {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        totalDebitMinor: 0,
        totalCreditMinor: 0,
      };
      existing.totalDebitMinor += line.debitMinor;
      existing.totalCreditMinor += line.creditMinor;
      accountMap.set(acc.id, existing);
    }

    const accounts = Array.from(accountMap.values())
      .map((a) => ({ ...a, netMinor: a.totalDebitMinor - a.totalCreditMinor }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    const totalDebitMinor = accounts.reduce((s, a) => s + a.totalDebitMinor, 0);
    const totalCreditMinor = accounts.reduce((s, a) => s + a.totalCreditMinor, 0);

    return {
      asOfDate: today.toISOString().slice(0, 10),
      accounts,
      totals: {
        totalDebitMinor,
        totalCreditMinor,
        isBalanced: totalDebitMinor === totalCreditMinor,
      },
    };
  }

  // ─── Profit & Loss ──────────────────────────────────────────────────────────

  async getProfitLoss(accountId: string) {
    const today = new Date();

    const [invoiceAgg, paymentAgg, billAgg] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { accountId, deletedAt: null },
        _sum: { totalMinor: true },
      }),
      this.prisma.invoicePayment.aggregate({
        where: { accountId, deletedAt: null },
        _sum: { amountMinor: true },
      }),
      this.prisma.bill.aggregate({
        where: { accountId, deletedAt: null },
        _sum: { totalMinor: true },
      }),
    ]);

    const grossRevenueMinor = invoiceAgg._sum.totalMinor ?? 0;
    const paidRevenueMinor = paymentAgg._sum.amountMinor ?? 0;
    const outstandingRevenueMinor = grossRevenueMinor - paidRevenueMinor;
    const totalExpensesMinor = billAgg._sum.totalMinor ?? 0;
    const grossProfitMinor = grossRevenueMinor - totalExpensesMinor;

    return {
      asOfDate: today.toISOString().slice(0, 10),
      revenue: {
        grossRevenueMinor,
        paidRevenueMinor,
        outstandingRevenueMinor,
      },
      expenses: {
        totalBillsMinor: totalExpensesMinor,
      },
      grossProfitMinor,
      netProfitMinor: grossProfitMinor,
    };
  }

  // ─── Balance Sheet ──────────────────────────────────────────────────────────

  async getBalanceSheet(accountId: string) {
    const today = new Date();

    // 3 parallel queries — no N+1
    const [bankAccounts, invoices, billAgg] = await Promise.all([
      this.prisma.bankAccount.findMany({
        where: { accountId, deletedAt: null },
        select: { balanceMinor: true },
      }),
      this.prisma.invoice.findMany({
        where: { accountId, deletedAt: null },
        select: {
          totalMinor: true,
          payments: {
            where: { deletedAt: null },
            select: { amountMinor: true },
          },
        },
      }),
      this.prisma.bill.aggregate({
        where: { accountId, deletedAt: null },
        _sum: { totalMinor: true },
      }),
    ]);

    // Assets
    const cashAndBankMinor = bankAccounts.reduce((s, b) => s + b.balanceMinor, 0);
    const accountsReceivableMinor = invoices.reduce((s, inv) => {
      const paid = inv.payments.reduce((ps, p) => ps + p.amountMinor, 0);
      const outstanding = inv.totalMinor - paid;
      return s + (outstanding > 0 ? outstanding : 0);
    }, 0);
    const totalAssetsMinor = cashAndBankMinor + accountsReceivableMinor;

    // Liabilities (accounts payable = all bills, no bill payments yet)
    const accountsPayableMinor = billAgg._sum.totalMinor ?? 0;
    const totalLiabilitiesMinor = accountsPayableMinor;

    // Equity = retained earnings (gross revenue – total expenses)
    const grossRevenueMinor = invoices.reduce((s, inv) => s + inv.totalMinor, 0);
    const retainedEarningsMinor = grossRevenueMinor - accountsPayableMinor;
    const totalEquityMinor = retainedEarningsMinor;

    const totalLiabilitiesAndEquityMinor = totalLiabilitiesMinor + totalEquityMinor;
    const isBalanced = Math.abs(totalAssetsMinor - totalLiabilitiesAndEquityMinor) < 1;

    return {
      asOfDate: today.toISOString().slice(0, 10),
      assets: {
        cashAndBankMinor,
        accountsReceivableMinor,
        totalAssetsMinor,
      },
      liabilities: {
        accountsPayableMinor,
        totalLiabilitiesMinor,
      },
      equity: {
        retainedEarningsMinor,
        totalEquityMinor,
      },
      totalLiabilitiesAndEquityMinor,
      isBalanced,
    };
  }
}
