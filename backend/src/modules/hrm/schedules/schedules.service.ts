import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtPayload, dto: CreateScheduleDto) {
    if (dto.isDefault) {
      await this.prisma.workSchedule.updateMany({
        where: { accountId: user.accountId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.workSchedule.create({
      data: {
        accountId: user.accountId,
        name: dto.name,
        workStartTime: dto.workStartTime,
        workEndTime: dto.workEndTime,
        breakMinutes: dto.breakMinutes ?? 60,
        workDays: dto.workDays,
        gracePeriodMin: dto.gracePeriodMin ?? 10,
        saturdayEndTime: dto.saturdayEndTime ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  findAll(user: JwtPayload) {
    return this.prisma.workSchedule.findMany({
      where: { accountId: user.accountId },
      include: { _count: { select: { employees: true } } },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async update(user: JwtPayload, id: string, dto: Partial<CreateScheduleDto>) {
    await this.ensureExists(user.accountId, id);
    if (dto.isDefault) {
      await this.prisma.workSchedule.updateMany({
        where: { accountId: user.accountId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.workSchedule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.workStartTime !== undefined && { workStartTime: dto.workStartTime }),
        ...(dto.workEndTime !== undefined && { workEndTime: dto.workEndTime }),
        ...(dto.breakMinutes !== undefined && { breakMinutes: dto.breakMinutes }),
        ...(dto.workDays !== undefined && { workDays: dto.workDays }),
        ...(dto.gracePeriodMin !== undefined && { gracePeriodMin: dto.gracePeriodMin }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.saturdayEndTime !== undefined && { saturdayEndTime: dto.saturdayEndTime || null }),
      },
    });
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensureExists(user.accountId, id);
    const inUse = await this.prisma.employee.count({ where: { workScheduleId: id, deletedAt: null } });
    if (inUse > 0) {
      await this.prisma.employee.updateMany({ where: { workScheduleId: id }, data: { workScheduleId: null } });
    }
    await this.prisma.workSchedule.delete({ where: { id } });
  }

  private async ensureExists(accountId: string, id: string) {
    const s = await this.prisma.workSchedule.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!s) throw new NotFoundException('İş cədvəli tapılmadı');
    return s;
  }
}
