import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  const user: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
    accountId: 'account-1',
  };

  const createDto = {
    customerId: 'customer-1',
    issueDate: '2026-04-25',
    dueDate: '2026-05-25',
    currency: 'AZN',
    notes: 'Monthly invoice',
    lines: [
      {
        itemName: 'Subscription',
        description: 'Pro monthly plan',
        quantity: 2,
        unitPriceMinor: 1500,
        taxCode: 'VAT18',
        taxRate: 18,
      },
    ],
  };

  function createPrismaMock() {
    return {
      customer: {
        findFirst: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      invoiceLine: {
        updateMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
  }

  it('calculates invoice totals and auto-generates invoice number', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1' });
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.invoice.create.mockImplementation(async (args: any) => ({
      id: 'invoice-1',
      ...args.data,
      customer: { id: 'customer-1' },
      lines: args.data.lines.create,
    }));

    const service = new InvoicesService(prisma as any);
    const result = await service.create(user, createDto as any);

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'account-1',
          invoiceNumber: 'INV-000001',
          subTotalMinor: 3000,
          taxMinor: 540,
          discountMinor: 0,
          totalMinor: 3540,
          lines: {
            create: [
              expect.objectContaining({
                quantity: 2,
                unitPriceMinor: 1500,
                lineTotalMinor: 3540,
              }),
            ],
          },
        }),
      }),
    );
    expect(result.invoiceNumber).toBe('INV-000001');
  });

  it('returns 409 when client-provided invoice number already exists for account', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1' });
    prisma.invoice.findFirst.mockResolvedValue({ id: 'invoice-existing' });

    const service = new InvoicesService(prisma as any);

    await expect(
      service.create(user, {
        ...createDto,
        invoiceNumber: 'INV-2026-001',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('checks provided invoice number uniqueness within current account only', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1' });
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.invoice.create.mockResolvedValue({ id: 'invoice-1' });

    const service = new InvoicesService(prisma as any);

    await service.create(user, {
      ...createDto,
      invoiceNumber: ' INV-2026-010 ',
    } as any);

    expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: 'account-1',
        invoiceNumber: 'INV-2026-010',
      },
      select: { id: true },
    });
  });

  it('returns paginated invoice list response with correct meta', async () => {
    const prisma = createPrismaMock();
    prisma.$transaction.mockResolvedValue([[{ id: 'invoice-1' }], 41]);

    const service = new InvoicesService(prisma as any);
    const result = await service.list(user, { page: 2, limit: 20 } as any);

    expect(result).toEqual({
      data: [{ id: 'invoice-1' }],
      meta: {
        page: 2,
        limit: 20,
        total: 41,
        totalPages: 3,
      },
    });
  });

  it('excludes deleted invoices from getById and list queries', async () => {
    const prisma = createPrismaMock();
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockResolvedValue([[], 0]);

    const service = new InvoicesService(prisma as any);

    await expect(service.getById(user, 'invoice-1')).rejects.toBeInstanceOf(NotFoundException);

    await service.list(user, {} as any);
    expect(prisma.invoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'invoice-1',
          accountId: 'account-1',
          deletedAt: null,
        }),
      }),
    );
  });

  it('soft-deletes invoice and active lines on remove', async () => {
    const prisma = createPrismaMock();
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      accountId: 'account-1',
      customer: { id: 'customer-1' },
      lines: [],
    });
    prisma.$transaction.mockResolvedValue([]);

    const service = new InvoicesService(prisma as any);
    const result = await service.remove(user, 'invoice-1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.invoiceLine.updateMany).toHaveBeenCalledWith({
      where: {
        invoiceId: 'invoice-1',
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ deleted: true, id: 'invoice-1' });
  });

  it('rejects invalid invoice number when blank after trim', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1' });

    const service = new InvoicesService(prisma as any);

    await expect(
      service.create(user, {
        ...createDto,
        invoiceNumber: '   ',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
