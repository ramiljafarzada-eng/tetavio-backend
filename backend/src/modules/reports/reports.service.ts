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
}
