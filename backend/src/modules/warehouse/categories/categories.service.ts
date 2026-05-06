import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: JwtPayload) {
    return this.prisma.productCategory.findMany({
      where: { accountId: user.accountId },
      include: { children: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(user: JwtPayload, dto: CreateCategoryDto) {
    return this.prisma.productCategory.create({
      data: { accountId: user.accountId, name: dto.name, parentId: dto.parentId },
    });
  }

  async update(user: JwtPayload, id: string, dto: UpdateCategoryDto) {
    await this.ensure(user.accountId, id);
    return this.prisma.productCategory.update({
      where: { id },
      data: { ...(dto.name !== undefined && { name: dto.name }), ...(dto.parentId !== undefined && { parentId: dto.parentId }) },
    });
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensure(user.accountId, id);
    await this.prisma.productCategory.delete({ where: { id } });
  }

  private async ensure(accountId: string, id: string) {
    const c = await this.prisma.productCategory.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!c) throw new NotFoundException('Kateqoriya tapılmadı');
    return c;
  }
}
