import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { HrmRequestContext } from '../guards/hrm-scope.guard';
import {
  CreateLeaveRequestDto,
  LeaveTypeDto,
  RejectLeaveDto,
} from './dto/create-leave-request.dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private countWorkdays(start: Date, end: Date): number {
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  private getWorkdaysBetween(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  private async resolveEmployee(user: JwtPayload) {
    const emp = await this.prisma.employee.findFirst({
      where: { accountId: user.accountId, userId: user.sub, deletedAt: null },
      select: { id: true, accountId: true, departmentId: true, hrmRole: true },
    });
    if (!emp) throw new NotFoundException('İşçi qeydi tapılmadı');
    return emp;
  }

  async create(user: JwtPayload, dto: CreateLeaveRequestDto) {
    const employee = await this.resolveEmployee(user);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('Bitiş tarixi başlanğıc tarixindən əvvəl ola bilməz');
    }

    const days = this.countWorkdays(start, end);
    if (days === 0) throw new BadRequestException('Seçilmiş tarixlər iş günü deyil');

    const year = start.getFullYear();

    if (dto.leaveType !== LeaveTypeDto.UNPAID) {
      const balance = await this.prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveType_year: {
            employeeId: employee.id,
            leaveType: dto.leaveType as never,
            year,
          },
        },
      });
      const available =
        (balance?.allocated ?? 0) +
        (balance?.carried ?? 0) -
        (balance?.used ?? 0) -
        (balance?.pending ?? 0);

      if (days > available) {
        throw new BadRequestException(
          `Kifayət qədər məzuniyyət günü yoxdur. Mövcud: ${available}, tələb: ${days}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          accountId: user.accountId,
          employeeId: employee.id,
          leaveType: dto.leaveType as never,
          startDate: start,
          endDate: end,
          daysRequested: days,
          reason: dto.reason,
        },
      });

      if (dto.leaveType !== LeaveTypeDto.UNPAID) {
        await tx.leaveBalance.upsert({
          where: {
            employeeId_leaveType_year: {
              employeeId: employee.id,
              leaveType: dto.leaveType as never,
              year,
            },
          },
          create: {
            accountId: user.accountId,
            employeeId: employee.id,
            leaveType: dto.leaveType as never,
            year,
            pending: days,
          },
          update: { pending: { increment: days } },
        });
      }

      await this.audit.logAction({
        accountId: user.accountId,
        actorUserId: user.sub,
        action: 'hrm.leave.requested',
        entityType: 'LeaveRequest',
        entityId: request.id,
        metadata: { leaveType: dto.leaveType, days },
      });

      return request;
    });
  }

  async approveByManager(id: string, user: JwtPayload) {
    const req = await this.findRequestOwned(id, user.accountId);
    if (req.status !== 'PENDING') {
      throw new BadRequestException('Yalnız PENDING sorğu menecer tərəfindən təsdiqlənə bilər');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'MANAGER_APPROVED',
        managerApprovedBy: user.sub,
        managerApprovedAt: new Date(),
      },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.leave.manager_approved',
      entityType: 'LeaveRequest',
      entityId: id,
    });

    return updated;
  }

  async approveByHR(id: string, user: JwtPayload) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.leaveRequest.findFirst({
        where: { id, accountId: user.accountId },
      });
      if (!req) throw new NotFoundException('Sorğu tapılmadı');
      if (req.status !== 'MANAGER_APPROVED') {
        throw new BadRequestException('Yalnız menecer tərəfindən təsdiqlənmiş sorğu HR tərəfindən təsdiqlənə bilər');
      }

      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: 'HR_APPROVED',
          hrApprovedBy: user.sub,
          hrApprovedAt: new Date(),
        },
      });

      if (req.leaveType !== 'UNPAID') {
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: req.employeeId,
            leaveType: req.leaveType,
            year: req.startDate.getFullYear(),
          },
          data: {
            pending: { decrement: req.daysRequested },
            used: { increment: req.daysRequested },
          },
        });
      }

      const workdays = this.getWorkdaysBetween(req.startDate, req.endDate);
      await tx.attendanceLog.createMany({
        data: workdays.map((date) => ({
          accountId: req.accountId,
          employeeId: req.employeeId,
          date,
          status: 'ON_LEAVE' as never,
          workedMinutes: 0,
          source: 'MANUAL',
        })),
        skipDuplicates: true,
      });

      await this.audit.logAction({
        accountId: user.accountId,
        actorUserId: user.sub,
        action: 'hrm.leave.hr_approved',
        entityType: 'LeaveRequest',
        entityId: id,
        metadata: { daysApproved: req.daysRequested },
      });

      return updated;
    });
  }

  async reject(id: string, user: JwtPayload, dto: RejectLeaveDto) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.leaveRequest.findFirst({
        where: { id, accountId: user.accountId },
      });
      if (!req) throw new NotFoundException('Sorğu tapılmadı');
      if (!['PENDING', 'MANAGER_APPROVED'].includes(req.status)) {
        throw new BadRequestException('Bu sorğu artıq tamamlanmış vəziyyətdədir');
      }

      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedBy: user.sub,
          rejectedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
      });

      if (req.leaveType !== 'UNPAID' && req.status === 'PENDING') {
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: req.employeeId,
            leaveType: req.leaveType,
            year: req.startDate.getFullYear(),
          },
          data: { pending: { decrement: req.daysRequested } },
        });
      }

      await this.audit.logAction({
        accountId: user.accountId,
        actorUserId: user.sub,
        action: 'hrm.leave.rejected',
        entityType: 'LeaveRequest',
        entityId: id,
      });

      return updated;
    });
  }

  async cancel(id: string, user: JwtPayload) {
    const employee = await this.resolveEmployee(user);

    return this.prisma.$transaction(async (tx) => {
      const req = await tx.leaveRequest.findFirst({
        where: { id, accountId: user.accountId, employeeId: employee.id },
      });
      if (!req) throw new NotFoundException('Sorğu tapılmadı');
      if (!['PENDING', 'MANAGER_APPROVED'].includes(req.status)) {
        throw new BadRequestException('Təsdiqlənmiş məzuniyyəti ləğv edə bilməzsiniz');
      }

      const updated = await tx.leaveRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      if (req.leaveType !== 'UNPAID') {
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: req.employeeId,
            leaveType: req.leaveType,
            year: req.startDate.getFullYear(),
          },
          data: { pending: { decrement: req.daysRequested } },
        });
      }

      return updated;
    });
  }

  async findAll(
    user: JwtPayload,
    ctx: Pick<HrmRequestContext, 'hrmScope' | 'hrmEmployeeId' | 'hrmDeptId'>,
  ) {
    const where: Prisma.LeaveRequestWhereInput = { accountId: user.accountId };

    if (ctx.hrmScope === 'SELF_ONLY' && ctx.hrmEmployeeId) {
      where.employeeId = ctx.hrmEmployeeId;
    } else if (ctx.hrmScope === 'DEPT_ONLY' && ctx.hrmDeptId) {
      where.employee = { departmentId: ctx.hrmDeptId };
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBalances(user: JwtPayload, employeeId: string) {
    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { accountId: user.accountId, employeeId, year },
    });
  }

  private async findRequestOwned(id: string, accountId: string) {
    const req = await this.prisma.leaveRequest.findFirst({
      where: { id, accountId },
    });
    if (!req) throw new NotFoundException('Sorğu tapılmadı');
    return req;
  }
}
