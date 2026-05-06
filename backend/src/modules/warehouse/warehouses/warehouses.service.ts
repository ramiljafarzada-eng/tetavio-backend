import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: JwtPayload) {
    return this.prisma.warehouse.findMany({
      where: { accountId: user.accountId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async create(user: JwtPayload, dto: CreateWarehouseDto) {
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { accountId: user.accountId },
        data: { isDefault: false },
      });
    }
    return this.prisma.warehouse.create({
      data: {
        accountId: user.accountId,
        name: dto.name,
        code: dto.code,
        address: dto.address,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(user: JwtPayload, id: string, dto: UpdateWarehouseDto) {
    await this.ensure(user.accountId, id);
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { accountId: user.accountId, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.warehouse.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensure(user.accountId, id);
    await this.prisma.warehouse.delete({ where: { id } });
  }

  private async ensure(accountId: string, id: string) {
    const w = await this.prisma.warehouse.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!w) throw new NotFoundException('Anbar tapılmadı');
    return w;
  }
}
