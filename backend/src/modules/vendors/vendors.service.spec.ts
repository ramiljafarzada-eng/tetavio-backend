import { NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { VendorsService } from './vendors.service';

describe('VendorsService', () => {
  const user: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
    accountId: 'account-1',
  };

  function createPrismaMock() {
    return {
      vendor: {
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
  }

  it('returns paginated vendor list response with correct meta', async () => {
    const prisma = createPrismaMock();
    prisma.$transaction.mockResolvedValue([[{ id: 'vendor-1' }], 5]);

    const service = new VendorsService(prisma as any);
    const result = await service.list(user, { page: 1, limit: 20 } as any);

    expect(result).toEqual({
      data: [{ id: 'vendor-1' }],
      meta: {
        page: 1,
        limit: 20,
        total: 5,
        totalPages: 1,
      },
    });
  });

  it('excludes deleted vendors from getById and update flow', async () => {
    const prisma = createPrismaMock();
    prisma.vendor.findFirst.mockResolvedValue(null);

    const service = new VendorsService(prisma as any);

    await expect(service.getById(user, 'vendor-1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(user, 'vendor-1', { vendorName: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft-deletes vendor on remove', async () => {
    const prisma = createPrismaMock();
    prisma.vendor.findFirst.mockResolvedValue({ id: 'vendor-1', accountId: 'account-1' });
    prisma.vendor.update.mockResolvedValue({ id: 'vendor-1' });

    const service = new VendorsService(prisma as any);
    const result = await service.remove(user, 'vendor-1');

    expect(prisma.vendor.update).toHaveBeenCalledWith({
      where: { id: 'vendor-1' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ deleted: true, id: 'vendor-1' });
  });
});
