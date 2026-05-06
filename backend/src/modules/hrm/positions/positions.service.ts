import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtPayload, dto: CreatePositionDto) {
    const exists = await this.prisma.position.findFirst({
      where: { accountId: user.accountId, title: dto.title },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Bu vəzifə artıq mövcuddur');

    return this.prisma.position.create({
      data: { accountId: user.accountId, title: dto.title, level: dto.level ?? 1 },
    });
  }

  findAll(user: JwtPayload) {
    return this.prisma.position.findMany({
      where: { accountId: user.accountId },
      include: { _count: { select: { employees: true } } },
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
    });
  }

  async update(user: JwtPayload, id: string, dto: Partial<CreatePositionDto>) {
    await this.ensureExists(user.accountId, id);
    return this.prisma.position.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.level !== undefined && { level: dto.level }),
      },
    });
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensureExists(user.accountId, id);
    const inUse = await this.prisma.employee.count({ where: { positionId: id, deletedAt: null } });
    if (inUse > 0) throw new ConflictException('Bu vəzifəyə təyin olunmuş işçilər var');
    await this.prisma.position.delete({ where: { id } });
  }

  private async ensureExists(accountId: string, id: string) {
    const pos = await this.prisma.position.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!pos) throw new NotFoundException('Vəzifə tapılmadı');
    return pos;
  }
}
