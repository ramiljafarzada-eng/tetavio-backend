import { Injectable } from '@nestjs/common';
import {
  Prisma,
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

  async getAccounts(page: number, limit: number, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const baseWhere: Prisma.AccountWhereInput = {
      users: { none: { role: UserRole.SUPER_ADMIN } },
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                users: {
                  some: {
                    role: UserRole.OWNER,
                    email: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, accounts] = await Promise.all([
      this.prisma.account.count({ where: baseWhere }),
      this.prisma.account.findMany({
        where: baseWhere,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
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
            select: {
              status: true,
              currentPeriodEnd: true,
              plan: { select: { code: true, name: true } },
            },
            take: 1,
          },
          _count: {
            select: {
              users: true,
              customers: { where: { deletedAt: null } },
              vendors: { where: { deletedAt: null } },
              invoices: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const accountIds = accounts.map((a) => a.id);
    const invoiceTotals =
      accountIds.length > 0
        ? await this.prisma.invoice.groupBy({
            by: ['accountId'],
            where: { accountId: { in: accountIds }, deletedAt: null },
            _sum: { totalMinor: true },
          })
        : [];

    const totalsMap = new Map(
      invoiceTotals.map((t) => [t.accountId, t._sum.totalMinor ?? 0]),
    );

    return {
      data: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        ownerEmail: a.users[0]?.email ?? null,
        planCode: a.subscriptions[0]?.plan?.code ?? null,
        planName: a.subscriptions[0]?.plan?.name ?? null,
        subscriptionStatus: a.subscriptions[0]?.status ?? null,
        currentPeriodEnd: a.subscriptions[0]?.currentPeriodEnd ?? null,
        userCount: a._count.users,
        customerCount: a._count.customers,
        vendorCount: a._count.vendors,
        invoiceCount: a._count.invoices,
        invoiceTotalMinor: totalsMap.get(a.id) ?? 0,
        createdAt: a.createdAt,
      })),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        pageCount: Math.ceil(total / safeLimit),
      },
    };
  }

  async getFinance() {
    const noAdmin: Prisma.AccountWhereInput = {
      users: { none: { role: UserRole.SUPER_ADMIN } },
    };

    const [invoiceAgg, totalAccounts, paidAccounts, freeAccounts, accountsWithPlan] =
      await Promise.all([
        this.prisma.invoice.aggregate({
          _sum: { totalMinor: true },
          _count: { _all: true },
          where: { deletedAt: null },
        }),
        this.prisma.account.count({ where: noAdmin }),
        this.prisma.account.count({
          where: {
            ...noAdmin,
            subscriptions: {
              some: {
                status: SubscriptionStatus.ACTIVE,
                plan: { interval: PlanInterval.MONTH },
              },
            },
          },
        }),
        this.prisma.account.count({
          where: {
            ...noAdmin,
            subscriptions: { some: { plan: { interval: PlanInterval.NONE } } },
          },
        }),
        this.prisma.account.findMany({
          where: noAdmin,
          select: {
            subscriptions: {
              select: { plan: { select: { code: true, name: true } } },
              take: 1,
            },
          },
        }),
      ]);

    const totalInvoiceValueMinor = invoiceAgg._sum.totalMinor ?? 0;
    const totalInvoices = invoiceAgg._count._all;
    const averageInvoiceValueMinor =
      totalInvoices > 0 ? Math.round(totalInvoiceValueMinor / totalInvoices) : 0;
    const paidConversionRate =
      totalAccounts > 0
        ? Math.round((paidAccounts / totalAccounts) * 10000) / 100
        : 0;

    // Plan distribution
    const planMap = new Map<string, { planCode: string; planName: string; count: number }>();
    for (const acc of accountsWithPlan) {
      const plan = acc.subscriptions[0]?.plan;
      const code = plan?.code ?? 'FREE';
      const name = plan?.name ?? 'Free';
      const entry = planMap.get(code);
      if (entry) {
        entry.count++;
      } else {
        planMap.set(code, { planCode: code, planName: name, count: 1 });
      }
    }
    const planDistribution = [...planMap.values()]
      .map((p) => ({ planCode: p.planCode, planName: p.planName, accountCount: p.count }))
      .sort((a, b) => b.accountCount - a.accountCount);

    // Top 10 accounts by revenue
    const topGroups = await this.prisma.invoice.groupBy({
      by: ['accountId'],
      where: { deletedAt: null },
      _sum: { totalMinor: true },
      _count: { _all: true },
      orderBy: { _sum: { totalMinor: 'desc' } },
      take: 10,
    });

    const topAccountIds = topGroups.map((g) => g.accountId);
    const topAccountRows =
      topAccountIds.length > 0
        ? await this.prisma.account.findMany({
            where: { id: { in: topAccountIds }, ...noAdmin },
            select: {
              id: true,
              name: true,
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
          })
        : [];

    const accDetailsMap = new Map(topAccountRows.map((a) => [a.id, a]));
    const topAccountsByRevenue = topGroups.reduce<
      Array<{
        accountId: string;
        accountName: string;
        ownerEmail: string | null;
        planCode: string | null;
        invoiceCount: number;
        invoiceTotalMinor: number;
      }>
    >((result, g) => {
      const acc = accDetailsMap.get(g.accountId);
      if (!acc) return result;
      result.push({
        accountId: acc.id,
        accountName: acc.name,
        ownerEmail: acc.users[0]?.email ?? null,
        planCode: acc.subscriptions[0]?.plan?.code ?? null,
        invoiceCount: g._count._all,
        invoiceTotalMinor: g._sum.totalMinor ?? 0,
      });
      return result;
    }, []);

    return {
      totalInvoiceValueMinor,
      totalInvoices,
      averageInvoiceValueMinor,
      paidAccounts,
      freeAccounts,
      totalAccounts,
      paidConversionRate,
      currency: 'AZN',
      planDistribution,
      topAccountsByRevenue,
    };
  }

  async getSubscriptions(page: number, limit: number, status?: string, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const noAdmin: Prisma.AccountWhereInput = {
      users: { none: { role: UserRole.SUPER_ADMIN } },
    };

    // Build status filter
    let statusFilter: Prisma.AccountWhereInput = {};
    if (status) {
      const s = status.toUpperCase();
      if (s === 'FREE') {
        statusFilter = {
          subscriptions: { some: { plan: { interval: PlanInterval.NONE } } },
        };
      } else if (
        s === 'ACTIVE' ||
        s === 'EXPIRED' ||
        s === 'CANCELED'
      ) {
        statusFilter = {
          subscriptions: { some: { status: s as SubscriptionStatus } },
        };
      }
    }

    const searchFilter: Prisma.AccountWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              users: {
                some: {
                  role: UserRole.OWNER,
                  email: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          ],
        }
      : {};

    const baseWhere: Prisma.AccountWhereInput = {
      ...noAdmin,
      ...statusFilter,
      ...searchFilter,
    };

    const [
      totalAccounts,
      freeAccounts,
      paidAccounts,
      activeSubscriptions,
      expiredSubscriptions,
      canceledSubscriptions,
    ] = await Promise.all([
      this.prisma.account.count({ where: noAdmin }),
      this.prisma.account.count({
        where: {
          ...noAdmin,
          subscriptions: { some: { plan: { interval: PlanInterval.NONE } } },
        },
      }),
      this.prisma.account.count({
        where: {
          ...noAdmin,
          subscriptions: {
            some: {
              status: SubscriptionStatus.ACTIVE,
              plan: { interval: PlanInterval.MONTH },
            },
          },
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          account: noAdmin,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.EXPIRED,
          account: noAdmin,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELED,
          account: noAdmin,
        },
      }),
    ]);

    const [total, accounts] = await Promise.all([
      this.prisma.account.count({ where: baseWhere }),
      this.prisma.account.findMany({
        where: baseWhere,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
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
            select: {
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              createdAt: true,
              plan: { select: { code: true, name: true, interval: true } },
            },
            take: 1,
          },
        },
      }),
    ]);

    return {
      summary: {
        totalAccounts,
        freeAccounts,
        paidAccounts,
        activeSubscriptions,
        expiredSubscriptions,
        canceledSubscriptions,
      },
      data: accounts.map((a) => {
        const sub = a.subscriptions[0];
        return {
          accountId: a.id,
          accountName: a.name,
          ownerEmail: a.users[0]?.email ?? null,
          planCode: sub?.plan?.code ?? 'FREE',
          planName: sub?.plan?.name ?? 'Free',
          planInterval: sub?.plan?.interval ?? null,
          subscriptionStatus: (sub?.status ?? 'FREE') as string,
          currentPeriodStart: sub?.currentPeriodStart ?? null,
          currentPeriodEnd: sub?.currentPeriodEnd ?? null,
          createdAt: a.createdAt,
        };
      }),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        pageCount: Math.ceil(total / safeLimit),
      },
    };
  }

  async getActivity(page: number, limit: number, type?: string, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const upperType = (type ?? 'ALL').toUpperCase();

    const wantAccount  = upperType === 'ALL' || upperType === 'ACCOUNT';
    const wantUser     = upperType === 'ALL' || upperType === 'USER';
    const wantInvoice  = upperType === 'ALL' || upperType === 'INVOICE';
    const wantCustomer = upperType === 'ALL' || upperType === 'CUSTOMER';
    const wantVendor   = upperType === 'ALL' || upperType === 'VENDOR';

    const fetchLimit = Math.min(safePage * safeLimit + safeLimit, 500);
    const noAdmin: Prisma.AccountWhereInput = {
      users: { none: { role: UserRole.SUPER_ADMIN } },
    };

    const [accountRows, userRows, invoiceRows, customerRows, vendorRows] =
      await Promise.all([
        wantAccount
          ? this.prisma.account.findMany({
              where: {
                ...noAdmin,
                ...(search
                  ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take: fetchLimit,
              select: {
                id: true,
                name: true,
                createdAt: true,
                users: {
                  where: { role: UserRole.OWNER },
                  select: { email: true },
                  take: 1,
                },
              },
            })
          : Promise.resolve([]),

        wantUser
          ? this.prisma.user.findMany({
              where: {
                role: { not: UserRole.SUPER_ADMIN },
                ...(search
                  ? { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take: fetchLimit,
              select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true,
                account: { select: { name: true } },
              },
            })
          : Promise.resolve([]),

        wantInvoice
          ? this.prisma.invoice.findMany({
              where: {
                deletedAt: null,
                account: noAdmin,
                ...(search
                  ? { invoiceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take: fetchLimit,
              select: {
                id: true,
                invoiceNumber: true,
                createdAt: true,
                account: { select: { name: true } },
                customer: { select: { displayName: true } },
              },
            })
          : Promise.resolve([]),

        wantCustomer
          ? this.prisma.customer.findMany({
              where: {
                deletedAt: null,
                account: noAdmin,
                ...(search
                  ? { displayName: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take: fetchLimit,
              select: {
                id: true,
                displayName: true,
                email: true,
                createdAt: true,
                account: { select: { name: true } },
              },
            })
          : Promise.resolve([]),

        wantVendor
          ? this.prisma.vendor.findMany({
              where: {
                deletedAt: null,
                account: noAdmin,
                ...(search
                  ? { vendorName: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
              orderBy: { createdAt: 'desc' },
              take: fetchLimit,
              select: {
                id: true,
                vendorName: true,
                email: true,
                createdAt: true,
                account: { select: { name: true } },
              },
            })
          : Promise.resolve([]),
      ]);

    const [cntAccount, cntUser, cntInvoice, cntCustomer, cntVendor] =
      await Promise.all([
        wantAccount
          ? this.prisma.account.count({
              where: {
                ...noAdmin,
                ...(search
                  ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
            })
          : Promise.resolve(0),
        wantUser
          ? this.prisma.user.count({
              where: {
                role: { not: UserRole.SUPER_ADMIN },
                ...(search
                  ? { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
            })
          : Promise.resolve(0),
        wantInvoice
          ? this.prisma.invoice.count({
              where: {
                deletedAt: null,
                account: noAdmin,
                ...(search
                  ? { invoiceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
            })
          : Promise.resolve(0),
        wantCustomer
          ? this.prisma.customer.count({
              where: {
                deletedAt: null,
                account: noAdmin,
                ...(search
                  ? { displayName: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
            })
          : Promise.resolve(0),
        wantVendor
          ? this.prisma.vendor.count({
              where: {
                deletedAt: null,
                account: noAdmin,
                ...(search
                  ? { vendorName: { contains: search, mode: Prisma.QueryMode.insensitive } }
                  : {}),
              },
            })
          : Promise.resolve(0),
      ]);

    type ActivityItem = {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      accountName: string | null;
      userEmail: string | null;
      createdAt: Date;
    };

    const all: ActivityItem[] = [];

    for (const a of accountRows as any[]) {
      all.push({
        id: a.id,
        type: 'ACCOUNT',
        title: `New account: ${a.name}`,
        subtitle: 'Account registered',
        accountName: a.name,
        userEmail: a.users?.[0]?.email ?? null,
        createdAt: a.createdAt,
      });
    }
    for (const u of userRows as any[]) {
      all.push({
        id: u.id,
        type: 'USER',
        title: u.fullName ?? u.email,
        subtitle: 'User registered',
        accountName: u.account?.name ?? null,
        userEmail: u.email,
        createdAt: u.createdAt,
      });
    }
    for (const inv of invoiceRows as any[]) {
      all.push({
        id: inv.id,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber}`,
        subtitle: `For ${inv.customer?.displayName ?? '—'}`,
        accountName: inv.account?.name ?? null,
        userEmail: null,
        createdAt: inv.createdAt,
      });
    }
    for (const c of customerRows as any[]) {
      all.push({
        id: c.id,
        type: 'CUSTOMER',
        title: c.displayName,
        subtitle: c.email ?? 'Customer added',
        accountName: c.account?.name ?? null,
        userEmail: null,
        createdAt: c.createdAt,
      });
    }
    for (const v of vendorRows as any[]) {
      all.push({
        id: v.id,
        type: 'VENDOR',
        title: v.vendorName,
        subtitle: v.email ?? 'Vendor added',
        accountName: v.account?.name ?? null,
        userEmail: null,
        createdAt: v.createdAt,
      });
    }

    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = cntAccount + cntUser + cntInvoice + cntCustomer + cntVendor;
    const skip = (safePage - 1) * safeLimit;

    return {
      items: all.slice(skip, skip + safeLimit),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getSystemHealth() {
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      serverTime: new Date(),
      environment: process.env.NODE_ENV ?? 'development',
      database: { status: dbStatus },
      api: { status: 'ok' },
    };
  }
}
