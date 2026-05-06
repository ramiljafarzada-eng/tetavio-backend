import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { HrmRequestContext } from '../guards/hrm-scope.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async nextEmployeeCode(accountId: string): Promise<string> {
    const last = await this.prisma.employee.findFirst({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      select: { employeeCode: true },
    });
    if (!last) return 'E-0001';
    const num = parseInt(last.employeeCode.replace(/\D/g, ''), 10) || 0;
    return `E-${String(num + 1).padStart(4, '0')}`;
  }

  async create(user: JwtPayload, dto: CreateEmployeeDto) {
    if (dto.userId) {
      const existing = await this.prisma.employee.findFirst({
        where: { userId: dto.userId, accountId: user.accountId },
      });
      if (existing) {
        throw new ConflictException(
          'Bu istifadəçi artıq bir işçiyə bağlıdır',
        );
      }
    }

    const employeeCode = await this.nextEmployeeCode(user.accountId);

    const employee = await this.prisma.employee.create({
      data: {
        accountId: user.accountId,
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        taxId: dto.taxId,
        ssn: dto.ssn,
        bankAccount: dto.bankAccount,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        workScheduleId: dto.workScheduleId,
        managerId: dto.managerId,
        userId: dto.userId,
        employmentType: dto.employmentType,
        startDate: new Date(dto.startDate),
        baseSalaryMinor: dto.baseSalaryMinor,
        hrmRole: dto.hrmRole ?? 'EMPLOYEE',
      },
      include: { department: true, position: true, workSchedule: true },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.employee.created',
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { employeeCode, name: `${dto.firstName} ${dto.lastName}` },
    });

    return employee;
  }

  async findAll(
    user: JwtPayload,
    ctx: Pick<HrmRequestContext, 'hrmScope' | 'hrmEmployeeId' | 'hrmDeptId'>,
    query: ListEmployeesQueryDto,
  ) {
    const where: Prisma.EmployeeWhereInput = {
      accountId: user.accountId,
      deletedAt: null,
    };

    if (ctx.hrmScope === 'SELF_ONLY' && ctx.hrmEmployeeId) {
      where.id = ctx.hrmEmployeeId;
    } else if (ctx.hrmScope === 'DEPT_ONLY' && ctx.hrmDeptId) {
      where.departmentId = ctx.hrmDeptId;
    }

    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status as never;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(
    user: JwtPayload,
    id: string,
    ctx: Pick<HrmRequestContext, 'hrmScope' | 'hrmEmployeeId' | 'hrmDeptId'>,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      include: {
        department: true,
        position: true,
        workSchedule: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!employee) throw new NotFoundException('İşçi tapılmadı');

    if (
      ctx.hrmScope === 'SELF_ONLY' &&
      employee.id !== ctx.hrmEmployeeId
    ) {
      throw new NotFoundException('İşçi tapılmadı');
    }

    if (
      ctx.hrmScope === 'DEPT_ONLY' &&
      employee.departmentId !== ctx.hrmDeptId
    ) {
      throw new NotFoundException('İşçi tapılmadı');
    }

    return employee;
  }

  async update(user: JwtPayload, id: string, dto: UpdateEmployeeDto) {
    await this.ensureExists(user.accountId, id);

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: new Date(dto.dateOfBirth),
        }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.ssn !== undefined && { ssn: dto.ssn }),
        ...(dto.bankAccount !== undefined && { bankAccount: dto.bankAccount }),
        ...(dto.departmentId !== undefined && {
          departmentId: dto.departmentId,
        }),
        ...(dto.positionId !== undefined && { positionId: dto.positionId }),
        ...(dto.workScheduleId !== undefined && {
          workScheduleId: dto.workScheduleId,
        }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.employmentType !== undefined && {
          employmentType: dto.employmentType,
        }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.baseSalaryMinor !== undefined && {
          baseSalaryMinor: dto.baseSalaryMinor,
        }),
        ...(dto.status !== undefined && { status: dto.status as never }),
        ...(dto.hrmRole !== undefined && { hrmRole: dto.hrmRole }),
      },
      include: { department: true, position: true },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.employee.updated',
      entityType: 'Employee',
      entityId: id,
      metadata: { changedFields: Object.keys(dto) },
    });

    return updated;
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensureExists(user.accountId, id);

    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.employee.deleted',
      entityType: 'Employee',
      entityId: id,
    });
  }

  private async ensureExists(accountId: string, id: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, accountId, deletedAt: null },
      select: { id: true },
    });
    if (!emp) throw new NotFoundException('İşçi tapılmadı');
    return emp;
  }
}
