import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: JwtPayload, dto: CreateDepartmentDto) {
    if (dto.code) {
      const exists = await this.prisma.department.findFirst({
        where: { accountId: user.accountId, code: dto.code },
        select: { id: true },
      });
      if (exists) throw new ConflictException('Bu kod artıq istifadə olunur');
    }

    const dept = await this.prisma.department.create({
      data: {
        accountId: user.accountId,
        name: dto.name,
        code: dto.code,
        parentId: dto.parentId,
        managerId: dto.managerId,
      },
      include: { parent: { select: { id: true, name: true } }, manager: { select: { id: true, firstName: true, lastName: true } } },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.department.created',
      entityType: 'Department',
      entityId: dept.id,
      metadata: { name: dept.name },
    });

    return dept;
  }

  findAll(user: JwtPayload) {
    return this.prisma.department.findMany({
      where: { accountId: user.accountId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: JwtPayload, id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, accountId: user.accountId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        employees: { where: { deletedAt: null }, select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });
    if (!dept) throw new NotFoundException('Şöbə tapılmadı');
    return dept;
  }

  async update(user: JwtPayload, id: string, dto: UpdateDepartmentDto) {
    await this.ensureExists(user.accountId, id);

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.department.updated',
      entityType: 'Department',
      entityId: id,
      metadata: { changedFields: Object.keys(dto) },
    });

    return updated;
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensureExists(user.accountId, id);

    const hasEmployees = await this.prisma.employee.count({
      where: { departmentId: id, deletedAt: null },
    });
    if (hasEmployees > 0) {
      throw new ConflictException(
        'Şöbədə işçilər var. Əvvəlcə onları başqa şöbəyə köçürün',
      );
    }

    await this.prisma.department.delete({ where: { id } });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.department.deleted',
      entityType: 'Department',
      entityId: id,
    });
  }

  private async ensureExists(accountId: string, id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, accountId },
      select: { id: true },
    });
    if (!dept) throw new NotFoundException('Şöbə tapılmadı');
    return dept;
  }
}
