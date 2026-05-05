import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { HrmRequestContext } from '../guards/hrm-scope.guard';
import {
  AttendanceEngineService,
  WorkScheduleConfig,
} from './attendance-engine.service';
import { CheckInDto, CheckOutDto } from './dto/check-in.dto';
import { ListAttendanceQueryDto, ManualAttendanceDto } from './dto/manual-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: AttendanceEngineService,
    private readonly audit: AuditService,
  ) {}

  private async resolveEmployee(user: JwtPayload) {
    const emp = await this.prisma.employee.findFirst({
      where: { accountId: user.accountId, userId: user.sub, deletedAt: null },
      include: { workSchedule: true },
    });
    if (!emp) throw new NotFoundException('İşçi qeydi tapılmadı');
    return emp;
  }

  private buildScheduleConfig(workSchedule: {
    workStartTime: string;
    workEndTime: string;
    breakMinutes: number;
    gracePeriodMin: number;
    workDays: string;
  } | null): WorkScheduleConfig {
    if (!workSchedule) return this.engine.defaultSchedule();
    return {
      workStartTime: workSchedule.workStartTime,
      workEndTime: workSchedule.workEndTime,
      breakMinutes: workSchedule.breakMinutes,
      gracePeriodMin: workSchedule.gracePeriodMin,
      workDays: this.engine.parseWorkDays(workSchedule.workDays),
    };
  }

  async checkIn(user: JwtPayload, dto: CheckInDto) {
    const employee = await this.resolveEmployee(user);
    const checkInDate = new Date(dto.checkIn);
    const dateOnly = new Date(checkInDate.toISOString().slice(0, 10));

    const existing = await this.prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
    });
    if (existing) {
      throw new BadRequestException('Bu gün üçün artıq qeyd var');
    }

    const schedule = this.buildScheduleConfig(employee.workSchedule);
    const calc = this.engine.calculate(checkInDate, null, dateOnly, schedule);

    return this.prisma.attendanceLog.create({
      data: {
        accountId: user.accountId,
        employeeId: employee.id,
        date: dateOnly,
        checkIn: checkInDate,
        lateMinutes: calc.lateMinutes,
        status: calc.status as never,
        note: dto.note,
        source: 'DEVICE',
      },
    });
  }

  async checkOut(user: JwtPayload, dto: CheckOutDto) {
    const employee = await this.resolveEmployee(user);
    const checkOutDate = new Date(dto.checkOut);
    const dateOnly = new Date(checkOutDate.toISOString().slice(0, 10));

    const log = await this.prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
    });
    if (!log) throw new NotFoundException('Check-in qeydi tapılmadı');
    if (!log.checkIn) throw new BadRequestException('Əvvəlcə check-in edilməlidir');
    if (log.checkOut) throw new BadRequestException('Check-out artıq edilib');

    const schedule = this.buildScheduleConfig(employee.workSchedule);
    const calc = this.engine.calculate(
      log.checkIn,
      checkOutDate,
      dateOnly,
      schedule,
    );

    return this.prisma.attendanceLog.update({
      where: { id: log.id },
      data: {
        checkOut: checkOutDate,
        workedMinutes: calc.workedMinutes,
        overtimeMinutes: calc.overtimeMinutes,
        status: calc.status as never,
        ...(dto.note && { note: dto.note }),
      },
    });
  }

  async manualEntry(user: JwtPayload, dto: ManualAttendanceDto) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, accountId: user.accountId, deletedAt: null },
      include: { workSchedule: true },
    });
    if (!emp) throw new NotFoundException('İşçi tapılmadı');

    const dateOnly = new Date(dto.date);
    const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;

    const schedule = this.buildScheduleConfig(emp.workSchedule);
    const calc = this.engine.calculate(checkIn, checkOut, dateOnly, schedule);

    const resolvedStatus = (dto.status ?? calc.status) as never;

    const log = await this.prisma.attendanceLog.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: dateOnly } },
      create: {
        accountId: user.accountId,
        employeeId: emp.id,
        date: dateOnly,
        checkIn,
        checkOut,
        workedMinutes: calc.workedMinutes || null,
        lateMinutes: calc.lateMinutes,
        overtimeMinutes: calc.overtimeMinutes,
        status: resolvedStatus,
        note: dto.note,
        source: 'MANUAL',
      },
      update: {
        checkIn,
        checkOut,
        workedMinutes: calc.workedMinutes || null,
        lateMinutes: calc.lateMinutes,
        overtimeMinutes: calc.overtimeMinutes,
        status: resolvedStatus,
        ...(dto.note !== undefined && { note: dto.note }),
        source: 'MANUAL',
      },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.attendance.manual',
      entityType: 'AttendanceLog',
      entityId: log.id,
      metadata: { employeeId: emp.id, date: dto.date },
    });

    return log;
  }

  async findAll(
    user: JwtPayload,
    ctx: Pick<HrmRequestContext, 'hrmScope' | 'hrmEmployeeId' | 'hrmDeptId'>,
    query: ListAttendanceQueryDto,
  ) {
    const where: Prisma.AttendanceLogWhereInput = {
      accountId: user.accountId,
    };

    if (ctx.hrmScope === 'SELF_ONLY' && ctx.hrmEmployeeId) {
      where.employeeId = ctx.hrmEmployeeId;
    } else if (ctx.hrmScope === 'DEPT_ONLY' && ctx.hrmDeptId) {
      where.employee = { departmentId: ctx.hrmDeptId };
    }

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.dateFrom || query.dateTo) {
      where.date = {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        ...(query.dateTo && { lte: new Date(query.dateTo) }),
      };
    }

    return this.prisma.attendanceLog.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
    });
  }

  async getMonthlyReport(
    user: JwtPayload,
    employeeId: string,
    year: number,
    month: number,
  ) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const logs = await this.prisma.attendanceLog.findMany({
      where: { accountId: user.accountId, employeeId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    });

    const totalWorkedMinutes = logs.reduce((s, l) => s + (l.workedMinutes ?? 0), 0);
    const totalLateMinutes = logs.reduce((s, l) => s + l.lateMinutes, 0);
    const totalOvertimeMinutes = logs.reduce((s, l) => s + l.overtimeMinutes, 0);
    const presentDays = logs.filter((l) => ['PRESENT', 'LATE'].includes(l.status)).length;
    const absentDays = logs.filter((l) => l.status === 'ABSENT').length;
    const leaveDays = logs.filter((l) => l.status === 'ON_LEAVE').length;

    return {
      employeeId,
      year,
      month,
      logs,
      summary: {
        totalWorkedHours: +(totalWorkedMinutes / 60).toFixed(2),
        totalLateMinutes,
        totalOvertimeHours: +(totalOvertimeMinutes / 60).toFixed(2),
        presentDays,
        absentDays,
        leaveDays,
      },
    };
  }
}
