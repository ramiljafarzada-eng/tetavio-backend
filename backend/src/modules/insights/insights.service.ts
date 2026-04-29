import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PAID_STATUSES = ['PAID', 'Ödənilib'];
const OVERDUE_STATUSES = ['OVERDUE', 'Gecikib'];
const CANCELLED_STATUSES = ['CANCELLED', 'VOID'];

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialInsights(accountId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [invoices, customerCount] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { accountId, deletedAt: null },
        select: {
          id: true,
          customerId: true,
          status: true,
          totalMinor: true,
          dueDate: true,
          createdAt: true,
        },
      }),
      this.prisma.customer.count({
        where: { accountId, deletedAt: null },
      }),
    ]);

    const isPaid = (inv: { status: string }) => PAID_STATUSES.includes(inv.status);
    const isCancelled = (inv: { status: string }) => CANCELLED_STATUSES.includes(inv.status);
    const isOverdue = (inv: { status: string; dueDate: Date | null }) =>
      OVERDUE_STATUSES.includes(inv.status) ||
      (!isPaid(inv) && !isCancelled(inv) && inv.dueDate !== null && new Date(inv.dueDate) < now);

    const paidInvoices = invoices.filter(isPaid);
    const overdueInvoices = invoices.filter(isOverdue);
    const outstandingInvoices = invoices.filter((inv) => !isPaid(inv) && !isCancelled(inv));

    const sum = (list: { totalMinor: number }[]) =>
      list.reduce((acc, inv) => acc + inv.totalMinor, 0);

    const totalRevenueMinor = sum(invoices.filter((inv) => !isCancelled(inv)));
    const paidRevenueMinor = sum(paidInvoices);
    const overdueRevenueMinor = sum(overdueInvoices);
    const outstandingRevenueMinor = sum(outstandingInvoices);

    const recentPaidInvoices = paidInvoices.filter(
      (inv) => new Date(inv.createdAt) >= thirtyDaysAgo,
    );

    const paidByCustomer = new Map<string, number>();
    for (const inv of paidInvoices) {
      paidByCustomer.set(inv.customerId, (paidByCustomer.get(inv.customerId) ?? 0) + inv.totalMinor);
    }
    const topCustomerRevenue = paidByCustomer.size > 0 ? Math.max(...paidByCustomer.values()) : 0;
    const concentrationRatio = paidRevenueMinor > 0 ? topCustomerRevenue / paidRevenueMinor : 0;

    const summary = {
      totalRevenueMinor,
      paidRevenueMinor,
      outstandingRevenueMinor,
      overdueRevenueMinor,
      invoiceCount: invoices.length,
      paidInvoiceCount: paidInvoices.length,
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

    if (invoices.length > 0 && paidInvoices.length / invoices.length < 0.5) {
      insights.push({
        id: 'LOW_PAYMENT_CONVERSION',
        type: 'LOW_PAYMENT_CONVERSION',
        severity: 'MEDIUM',
        title: 'Low Payment Conversion Rate',
        description: `Only ${Math.round((paidInvoices.length / invoices.length) * 100)}% of your invoices have been paid.`,
        metricValue: Math.round((paidInvoices.length / invoices.length) * 100),
        recommendation: 'Review payment terms, send reminders for outstanding invoices, and consider offering multiple payment options.',
        createdAt: nowIso,
      });
    }

    if (recentPaidInvoices.length === 0) {
      insights.push({
        id: 'NO_RECENT_REVENUE',
        type: 'NO_RECENT_REVENUE',
        severity: 'HIGH',
        title: 'No Revenue in Last 30 Days',
        description: 'No paid invoices have been recorded in the last 30 days.',
        metricValue: 0,
        recommendation: 'Review your sales pipeline, follow up on open invoices, and reach out to inactive customers.',
        createdAt: nowIso,
      });
    }

    const isHealthy =
      recentPaidInvoices.length > 0 &&
      (paidRevenueMinor === 0 || overdueRevenueMinor < paidRevenueMinor * 0.1);

    if (isHealthy) {
      insights.push({
        id: 'HEALTHY_REVENUE_SIGNAL',
        type: 'HEALTHY_REVENUE_SIGNAL',
        severity: 'LOW',
        title: 'Healthy Revenue Signal',
        description: `You have received payment on ${recentPaidInvoices.length} invoice${recentPaidInvoices.length !== 1 ? 's' : ''} in the last 30 days with low overdue exposure.`,
        metricValue: recentPaidInvoices.length,
        recommendation: 'Maintain your current billing discipline and continue following up promptly on issued invoices.',
        createdAt: nowIso,
      });
    }

    return { summary, insights };
  }
}
