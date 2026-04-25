import { ConflictException, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const user: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
    accountId: 'account-1',
  };

  function createPrismaMock() {
    return {
      customer: {
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
  }

  it('returns paginated customer list response with correct meta', async () => {
    const prisma = createPrismaMock();
    prisma.$transaction.mockResolvedValue([[{ id: 'customer-1' }], 21]);

    const service = new CustomersService(prisma as any);
    const result = await service.list(user, { page: 2, limit: 20 } as any);

    expect(result).toEqual({
      data: [{ id: 'customer-1' }],
      meta: {
        page: 2,
        limit: 20,
        total: 21,
        totalPages: 2,
      },
    });
  });

  it('excludes deleted customers from getById and update flow', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue(null);

    const service = new CustomersService(prisma as any);

    await expect(service.getById(user, 'customer-1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(user, 'customer-1', { displayName: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks deleting customer referenced by active invoice', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1', accountId: 'account-1' });
    prisma.invoice.findFirst.mockResolvedValue({ id: 'invoice-1', invoiceNumber: 'INV-000001' });

    const service = new CustomersService(prisma as any);

    await expect(service.remove(user, 'customer-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('soft-deletes customer when no active invoice references it', async () => {
    const prisma = createPrismaMock();
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1', accountId: 'account-1' });
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.customer.update.mockResolvedValue({ id: 'customer-1' });

    const service = new CustomersService(prisma as any);
    const result = await service.remove(user, 'customer-1');

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ deleted: true, id: 'customer-1' });
  });
});
