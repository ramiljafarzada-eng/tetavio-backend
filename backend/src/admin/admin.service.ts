import { Injectable } from '@nestjs/common';
import {
  PlanInterval,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalAccounts,
      activeUsers,
      freeAccounts,
      paidAccounts,
      totalCustomers,
      totalVendors,
      totalInvoices,
      invoiceAggregate,
      recentAccounts,
    ] = await Promise.all([
      // Users with role OWNER (excludes SUPER_ADMIN)
      this.prisma.user.count({
        where: { role: UserRole.OWNER },
      }),

      // Accounts that have no SUPER_ADMIN user
      this.prisma.account.count({
        where: { users: { none: { role: UserRole.SUPER_ADMIN } } },
      }),

      // Active OWNER users
      this.prisma.user.count({
        where: { role: UserRole.OWNER, status: UserStatus.ACTIVE },
      }),

      // Accounts on a free plan (interval = NONE)
      this.prisma.account.count({
        where: {
          users: { none: { role: UserRole.SUPER_ADMIN } },
          subscriptions: { some: { plan: { interval: PlanInterval.NONE } } },
        },
      }),

      // Accounts with an active paid subscription (interval = MONTH)
      this.prisma.account.count({
        where: {
          users: { none: { role: UserRole.SUPER_ADMIN } },
          subscriptions: {
            some: {
              status: SubscriptionStatus.ACTIVE,
              plan: { interval: PlanInterval.MONTH },
            },
          },
        },
      }),

      // Non-soft-deleted customers (cross-account)
      this.prisma.customer.count({ where: { deletedAt: null } }),

      // Non-soft-deleted vendors (cross-account)
      this.prisma.vendor.count({ where: { deletedAt: null } }),

      // Non-soft-deleted invoices (cross-account)
      this.prisma.invoice.count({ where: { deletedAt: null } }),

      // Sum of all non-soft-deleted invoice totals
      this.prisma.invoice.aggregate({
        _sum: { totalMinor: true },
        where: { deletedAt: null },
      }),

      // 10 most recently created non-admin accounts
      this.prisma.account.findMany({
        where: { users: { none: { role: UserRole.SUPER_ADMIN } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          createdAt: true,
          users: {
            where: { role: UserRole.OWNER },
            select: { email: true },
            take: 1,
          },
          subscriptions: {
            select: { plan: { select: { code: true } } },
            take: 1,
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalAccounts,
      activeUsers,
      freeAccounts,
      paidAccounts,
      totalCustomers,
      totalVendors,
      totalInvoices,
      totalInvoiceValueMinor: invoiceAggregate._sum.totalMinor ?? 0,
      currency: 'AZN',
      recentSignups: recentAccounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        ownerEmail: account.users[0]?.email ?? null,
        planCode: account.subscriptions[0]?.plan?.code ?? null,
        createdAt: account.createdAt,
      })),
    };
  }
}
