import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PAID_STATUSES = ['PAID', 'Ödənilib', 'PARTIAL'];
const OVERDUE_STATUSES = ['OVERDUE', 'Gecikib'];
const CANCELLED_STATUSES = ['CANCELLED', 'VOID'];

const INVOICE_WITH_PAYMENTS_SELECT = {
  id: true,
  customerId: true,
  status: true,
  totalMinor: true,
  dueDate: true,
  payments: {
    where: { deletedAt: null as null },
    select: { amountMinor: true, paymentDate: true },
  },
} as const;

type InvoiceWithPaymentsRaw = {
  id: string;
  customerId: string;
  status: string;
  totalMinor: number;
  dueDate: Date | null;
  payments: { amountMinor: number; paymentDate: Date }[];
};

type InvoiceWithBalance = InvoiceWithPaymentsRaw & {
  paidAmountMinor: number;
  outstandingMinor: number;
};

function attachBalance(inv: InvoiceWithPaymentsRaw): InvoiceWithBalance {
  const paidAmountMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
  return { ...inv, paidAmountMinor, outstandingMinor: inv.totalMinor - paidAmountMinor };
}

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialInsights(accountId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [rawInvoices, customerCount] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { accountId, deletedAt: null },
        select: INVOICE_WITH_PAYMENTS_SELECT,
      }),
      this.prisma.customer.count({
        where: { accountId, deletedAt: null },
      }),
    ]);

    const invoices = rawInvoices.map(attachBalance);

    const isCancelled = (inv: InvoiceWithBalance) => CANCELLED_STATUSES.includes(inv.status);
    const isFullyPaid = (inv: InvoiceWithBalance) =>
      inv.totalMinor > 0 && inv.outstandingMinor <= 0;
    const isOverdue = (inv: InvoiceWithBalance) =>
      OVERDUE_STATUSES.includes(inv.status) ||
      (!isFullyPaid(inv) && !isCancelled(inv) && inv.dueDate !== null && new Date(inv.dueDate) < now);

    const overdueInvoices = invoices.filter(isOverdue);
    const outstandingInvoices = invoices.filter((inv) => !isFullyPaid(inv) && !isCancelled(inv));

    // Paid revenue = total of all payments received across account
    const allPayments = invoices.flatMap((inv) => inv.payments);
    const paidRevenueMinor = allPayments.reduce((s, p) => s + p.amountMinor, 0);

    const totalRevenueMinor = invoices
      .filter((inv) => !isCancelled(inv))
      .reduce((s, inv) => s + inv.totalMinor, 0);

    const overdueRevenueMinor = overdueInvoices.reduce((s, inv) => s + inv.outstandingMinor, 0);
    const outstandingRevenueMinor = outstandingInvoices.reduce((s, inv) => s + inv.outstandingMinor, 0);

    const recentPayments = allPayments.filter(
      (p) => new Date(p.paymentDate) >= thirtyDaysAgo,
    );
    const paidLast30DaysMinor = recentPayments.reduce((s, p) => s + p.amountMinor, 0);

    const paidByCustomer = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.paidAmountMinor > 0) {
        paidByCustomer.set(
          inv.customerId,
          (paidByCustomer.get(inv.customerId) ?? 0) + inv.paidAmountMinor,
        );
      }
    }
    const topCustomerRevenue = paidByCustomer.size > 0 ? Math.max(...paidByCustomer.values()) : 0;
    const concentrationRatio = paidRevenueMinor > 0 ? topCustomerRevenue / paidRevenueMinor : 0;

    const paidInvoiceCount = invoices.filter(isFullyPaid).length;

    const summary = {
      totalRevenueMinor,
      paidRevenueMinor,
      outstandingRevenueMinor,
      overdueRevenueMinor,
      paidLast30DaysMinor,
      invoiceCount: invoices.length,
      paidInvoiceCount,
      overdueInvoiceCount: overdueInvoices.length,
      customerCount,
    };

    const nowIso = now.toISOString();
    const insights: {
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      metricValue: number;
      recommendation: string;
      createdAt: string;
    }[] = [];

    if (overdueInvoices.length > 0) {
      insights.push({
        id: 'OVERDUE_INVOICES',
        type: 'OVERDUE_INVOICES',
        severity: overdueRevenueMinor >= 100000 ? 'HIGH' : 'MEDIUM',
        title: 'Overdue Invoices Detected',
        description: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? 's' : ''} requiring attention.`,
        metricValue: overdueInvoices.length,
        recommendation: 'Follow up with customers to collect outstanding payments and consider tightening payment terms.',
        createdAt: nowIso,
      });
    }

    if (concentrationRatio > 0.5) {
      insights.push({
        id: 'CUSTOMER_CONCENTRATION_RISK',
        type: 'CUSTOMER_CONCENTRATION_RISK',
        severity: 'MEDIUM',
        title: 'Customer Concentration Risk',
        description: `Your top customer accounts for ${Math.round(concentrationRatio * 100)}% of paid revenue.`,
        metricValue: Math.round(concentrationRatio * 100),
        recommendation: 'Diversify your customer base to reduce dependency on a single revenue source.',
        createdAt: nowIso,
      });
    }

    if (invoices.length > 0 && paidInvoiceCount / invoices.length < 0.5) {
      insights.push({
        id: 'LOW_PAYMENT_CONVERSION',
        type: 'LOW_PAYMENT_CONVERSION',
        severity: 'MEDIUM',
        title: 'Low Payment Conversion Rate',
        description: `Only ${Math.round((paidInvoiceCount / invoices.length) * 100)}% of your invoices have been fully paid.`,
        metricValue: Math.round((paidInvoiceCount / invoices.length) * 100),
        recommendation: 'Review payment terms, send reminders for outstanding invoices, and consider offering multiple payment options.',
        createdAt: nowIso,
      });
    }

    if (recentPayments.length === 0) {
      insights.push({
        id: 'NO_RECENT_REVENUE',
        type: 'NO_RECENT_REVENUE',
        severity: 'HIGH',
        title: 'No Revenue in Last 30 Days',
        description: 'No payments have been recorded in the last 30 days.',
        metricValue: 0,
        recommendation: 'Review your sales pipeline, follow up on open invoices, and reach out to inactive customers.',
        createdAt: nowIso,
      });
    }

    const isHealthy =
      recentPayments.length > 0 &&
      (paidRevenueMinor === 0 || overdueRevenueMinor < paidRevenueMinor * 0.1);

    if (isHealthy) {
      insights.push({
        id: 'HEALTHY_REVENUE_SIGNAL',
        type: 'HEALTHY_REVENUE_SIGNAL',
        severity: 'LOW',
        title: 'Healthy Revenue Signal',
        description: `You have received ${recentPayments.length} payment${recentPayments.length !== 1 ? 's' : ''} in the last 30 days with low overdue exposure.`,
        metricValue: recentPayments.length,
        recommendation: 'Maintain your current billing discipline and continue following up promptly on issued invoices.',
        createdAt: nowIso,
      });
    }

    return { summary, insights };
  }

  async getCashflowForecast(accountId: string) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const rawInvoices = await this.prisma.invoice.findMany({
      where: { accountId, deletedAt: null },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalMinor: true,
        dueDate: true,
        payments: {
          where: { deletedAt: null },
          select: { amountMinor: true, paymentDate: true },
        },
        customer: {
          select: { displayName: true, companyName: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const isCancelled = (inv: { status: string }) => CANCELLED_STATUSES.includes(inv.status);

    const invoices = rawInvoices.map((inv) => {
      const paidAmountMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
      const outstandingMinor = inv.totalMinor - paidAmountMinor;
      return { ...inv, paidAmountMinor, outstandingMinor };
    });

    const isFullyPaid = (inv: typeof invoices[number]) =>
      inv.totalMinor > 0 && inv.outstandingMinor <= 0;
    const isOpen = (inv: typeof invoices[number]) => !isFullyPaid(inv) && !isCancelled(inv);

    const dueDateOf = (inv: { dueDate: Date | null }) =>
      inv.dueDate ? new Date(inv.dueDate) : null;

    const openInvoices = invoices.filter(isOpen);
    const overdueInvoices = openInvoices.filter((inv) => {
      const d = dueDateOf(inv);
      return d !== null && d < now;
    });
    const dueSoonInvoices = openInvoices.filter((inv) => {
      const d = dueDateOf(inv);
      return d !== null && d >= now && d <= in7Days;
    });
    const due8to30Invoices = openInvoices.filter((inv) => {
      const d = dueDateOf(inv);
      return d !== null && d > in7Days && d <= in30Days;
    });
    const expectedNext30Invoices = openInvoices.filter((inv) => {
      const d = dueDateOf(inv);
      return d !== null && d >= now && d <= in30Days;
    });

    // Paid last 30 days = sum of payments with paymentDate >= 30 days ago
    const paidLast30DaysMinor = invoices
      .flatMap((inv) => inv.payments)
      .filter((p) => new Date(p.paymentDate) >= thirtyDaysAgo)
      .reduce((s, p) => s + p.amountMinor, 0);

    const sumMinor = (list: { outstandingMinor: number }[]) =>
      list.reduce((s, inv) => s + inv.outstandingMinor, 0);

    const expectedIncomingNext30DaysMinor = sumMinor(expectedNext30Invoices);
    const overdueAmountMinor = sumMinor(overdueInvoices);
    const dueSoonAmountMinor = sumMinor(dueSoonInvoices);

    let cashflowStatus: 'HEALTHY' | 'WATCH' | 'RISK' = 'HEALTHY';
    if (overdueAmountMinor > expectedIncomingNext30DaysMinor) {
      cashflowStatus = 'RISK';
    } else if (overdueInvoices.length > 0 || dueSoonInvoices.length > 0) {
      cashflowStatus = 'WATCH';
    }

    const summary = {
      expectedIncomingNext30DaysMinor,
      overdueAmountMinor,
      dueSoonAmountMinor,
      paidLast30DaysMinor,
      openInvoiceCount: openInvoices.length,
      overdueInvoiceCount: overdueInvoices.length,
      dueSoonInvoiceCount: dueSoonInvoices.length,
      cashflowStatus,
    };

    const buckets = [
      { label: 'Overdue', amountMinor: overdueAmountMinor, invoiceCount: overdueInvoices.length },
      { label: 'Due next 7 days', amountMinor: dueSoonAmountMinor, invoiceCount: dueSoonInvoices.length },
      { label: 'Due 8–30 days', amountMinor: sumMinor(due8to30Invoices), invoiceCount: due8to30Invoices.length },
      { label: 'Paid last 30 days', amountMinor: paidLast30DaysMinor, invoiceCount: 0 },
    ];

    const recommendations: {
      id: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string;
    }[] = [];

    if (overdueAmountMinor > 0) {
      recommendations.push({
        id: 'OVERDUE_COLLECTION_RISK',
        severity: overdueAmountMinor > expectedIncomingNext30DaysMinor ? 'HIGH' : 'MEDIUM',
        title: 'Overdue Collection Risk',
        description: `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? 's are' : ' is'} past due. Delayed collection affects your cashflow predictability.`,
        recommendation: 'Contact overdue customers immediately and establish a clear payment deadline to protect your cashflow.',
      });
    }

    if (dueSoonAmountMinor > 0) {
      recommendations.push({
        id: 'UPCOMING_COLLECTION_FOCUS',
        severity: 'MEDIUM',
        title: 'Upcoming Collection Focus',
        description: `${dueSoonInvoices.length} invoice${dueSoonInvoices.length !== 1 ? 's' : ''} are due within the next 7 days.`,
        recommendation: 'Send payment reminders now to ensure timely collection and reduce the risk of new overdue items.',
      });
    }

    if (cashflowStatus === 'HEALTHY') {
      recommendations.push({
        id: 'HEALTHY_CASHFLOW',
        severity: 'LOW',
        title: 'Cashflow Looks Healthy',
        description: 'No overdue invoices detected and your expected income is on track.',
        recommendation: 'Continue issuing invoices promptly and following up early to maintain this position.',
      });
    }

    const upcomingInvoices = openInvoices
      .filter((inv) => {
        const d = dueDateOf(inv);
        return d !== null && d <= in30Days;
      })
      .slice(0, 10)
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.displayName || inv.customer.companyName || '—',
        dueDate: inv.dueDate,
        totalMinor: inv.totalMinor,
        outstandingMinor: inv.outstandingMinor,
        status: inv.status,
      }));

    return { summary, buckets, recommendations, upcomingInvoices };
  }

  async getTrends(accountId: string) {
    const now = new Date();
    const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const currentEnd = now;
    const previousEnd = currentStart;

    const [invoices, currentPaymentsAgg, previousPaymentsAgg, currentCustomerCount, previousCustomerCount] = await Promise.all([
      // Invoice volume + outstanding use issueDate for period classification
      this.prisma.invoice.findMany({
        where: { accountId, deletedAt: null, issueDate: { gte: previousStart } },
        select: {
          status: true,
          totalMinor: true,
          issueDate: true,
          payments: {
            where: { deletedAt: null },
            select: { amountMinor: true },
          },
        },
      }),
      // Paid revenue uses paymentDate for accurate period classification
      this.prisma.invoicePayment.aggregate({
        where: {
          accountId,
          deletedAt: null,
          paymentDate: { gte: currentStart, lt: currentEnd },
        },
        _sum: { amountMinor: true },
      }),
      this.prisma.invoicePayment.aggregate({
        where: {
          accountId,
          deletedAt: null,
          paymentDate: { gte: previousStart, lt: previousEnd },
        },
        _sum: { amountMinor: true },
      }),
      this.prisma.customer.count({
        where: { accountId, deletedAt: null, createdAt: { gte: currentStart, lt: currentEnd } },
      }),
      this.prisma.customer.count({
        where: { accountId, deletedAt: null, createdAt: { gte: previousStart, lt: previousEnd } },
      }),
    ]);

    const isOpen = (inv: { status: string; totalMinor: number; payments: { amountMinor: number }[] }) => {
      const paid = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
      return !CANCELLED_STATUSES.includes(inv.status) && paid < inv.totalMinor;
    };

    const inCurrent = (inv: { issueDate: Date }) =>
      new Date(inv.issueDate) >= currentStart && new Date(inv.issueDate) < currentEnd;
    const inPrevious = (inv: { issueDate: Date }) =>
      new Date(inv.issueDate) >= previousStart && new Date(inv.issueDate) < previousEnd;

    const curInvoices = invoices.filter(inCurrent);
    const prevInvoices = invoices.filter(inPrevious);

    const currentRevenueMinor = currentPaymentsAgg._sum.amountMinor ?? 0;
    const previousRevenueMinor = previousPaymentsAgg._sum.amountMinor ?? 0;

    const sumOutstanding = (list: typeof invoices) =>
      list.filter(isOpen).reduce((s, inv) => {
        const paid = inv.payments.reduce((sp, p) => sp + p.amountMinor, 0);
        return s + (inv.totalMinor - paid);
      }, 0);

    const currentOutstandingMinor = sumOutstanding(curInvoices);
    const previousOutstandingMinor = sumOutstanding(prevInvoices);

    const pctChange = (current: number, previous: number): number => {
      if (previous === 0 && current > 0) return 100;
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    const summary = {
      currentRevenueMinor,
      previousRevenueMinor,
      revenueChangePercent: pctChange(currentRevenueMinor, previousRevenueMinor),
      currentInvoiceCount: curInvoices.length,
      previousInvoiceCount: prevInvoices.length,
      invoiceCountChangePercent: pctChange(curInvoices.length, prevInvoices.length),
      currentCustomerCount,
      previousCustomerCount,
      customerCountChangePercent: pctChange(currentCustomerCount, previousCustomerCount),
      currentOutstandingMinor,
      previousOutstandingMinor,
      outstandingChangePercent: pctChange(currentOutstandingMinor, previousOutstandingMinor),
    };

    const period = {
      currentStart: currentStart.toISOString(),
      currentEnd: currentEnd.toISOString(),
      previousStart: previousStart.toISOString(),
      previousEnd: previousEnd.toISOString(),
    };

    const trends: {
      id: string;
      type: string;
      direction: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string;
      currentValue: number;
      previousValue: number;
      changePercent: number;
    }[] = [];

    let hasNegativeTrend = false;

    if (currentRevenueMinor > previousRevenueMinor) {
      trends.push({
        id: 'REVENUE_GROWTH',
        type: 'REVENUE_GROWTH',
        direction: 'UP',
        severity: 'LOW',
        title: 'Revenue Growth',
        description: `Paid revenue increased by ${summary.revenueChangePercent}% compared to the previous 30 days.`,
        recommendation: 'Maintain your sales and collection discipline to sustain this growth.',
        currentValue: currentRevenueMinor,
        previousValue: previousRevenueMinor,
        changePercent: summary.revenueChangePercent,
      });
    }

    if (currentRevenueMinor < previousRevenueMinor) {
      const dropPct = Math.abs(summary.revenueChangePercent);
      const severity = dropPct >= 50 ? 'HIGH' : 'MEDIUM';
      hasNegativeTrend = true;
      trends.push({
        id: 'REVENUE_DROP',
        type: 'REVENUE_DROP',
        direction: 'DOWN',
        severity,
        title: 'Revenue Decline',
        description: `Paid revenue dropped by ${dropPct}% compared to the previous 30 days.`,
        recommendation: 'Review your sales pipeline, overdue invoices, and customer concentration.',
        currentValue: currentRevenueMinor,
        previousValue: previousRevenueMinor,
        changePercent: summary.revenueChangePercent,
      });
    }

    if (curInvoices.length < prevInvoices.length) {
      hasNegativeTrend = true;
      trends.push({
        id: 'INVOICE_VOLUME_DROP',
        type: 'INVOICE_VOLUME_DROP',
        direction: 'DOWN',
        severity: 'MEDIUM',
        title: 'Invoice Volume Decline',
        description: `Invoice issuance dropped from ${prevInvoices.length} to ${curInvoices.length} this period.`,
        recommendation: 'Check sales activity and your quote-to-invoice conversion flow.',
        currentValue: curInvoices.length,
        previousValue: prevInvoices.length,
        changePercent: summary.invoiceCountChangePercent,
      });
    }

    if (currentCustomerCount === 0 && previousCustomerCount > 0) {
      hasNegativeTrend = true;
      trends.push({
        id: 'CUSTOMER_GROWTH_STALLED',
        type: 'CUSTOMER_GROWTH_STALLED',
        direction: 'FLAT',
        severity: 'MEDIUM',
        title: 'Customer Acquisition Stalled',
        description: 'No new customers were added this period while the previous period had new customer activity.',
        recommendation: 'Review customer acquisition activity and consider reaching out to prospects.',
        currentValue: currentCustomerCount,
        previousValue: previousCustomerCount,
        changePercent: summary.customerCountChangePercent,
      });
    }

    if (currentOutstandingMinor > previousOutstandingMinor) {
      const increasePct = Math.abs(summary.outstandingChangePercent);
      const severity = increasePct >= 50 ? 'HIGH' : 'MEDIUM';
      hasNegativeTrend = true;
      trends.push({
        id: 'OUTSTANDING_INCREASE',
        type: 'OUTSTANDING_INCREASE',
        direction: 'UP',
        severity,
        title: 'Outstanding Balance Increasing',
        description: `Unpaid invoice balance grew by ${increasePct}% compared to the previous period.`,
        recommendation: 'Follow up on unpaid invoices earlier in the payment cycle.',
        currentValue: currentOutstandingMinor,
        previousValue: previousOutstandingMinor,
        changePercent: summary.outstandingChangePercent,
      });
    }

    if (!hasNegativeTrend) {
      trends.push({
        id: 'STABLE_OR_HEALTHY_TREND',
        type: 'STABLE_OR_HEALTHY_TREND',
        direction: 'STABLE',
        severity: 'LOW',
        title: 'Stable Financial Trend',
        description: 'No significant negative trends detected in this period.',
        recommendation: 'Continue monitoring revenue, collections, and customer activity regularly.',
        currentValue: 0,
        previousValue: 0,
        changePercent: 0,
      });
    }

    return { period, summary, trends };
  }
}
