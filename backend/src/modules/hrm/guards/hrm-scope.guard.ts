import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { HRM_SCOPE_KEY, HrmScope } from './hrm-scope.decorator';

export interface HrmRequestContext {
  hrmScope: HrmScope;
  hrmEmployeeId: string | null;
  hrmDeptId: string | null;
}

@Injectable()
export class HrmScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedScopes = this.reflector.get<HrmScope[]>(
      HRM_SCOPE_KEY,
      context.getHandler(),
    );

    if (!allowedScopes || allowedScopes.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user: JwtPayload } & HrmRequestContext>();

    const user = request.user;

    let userScope: HrmScope;
    let hrmEmployeeId: string | null = null;
    let hrmDeptId: string | null = null;

    if (['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      userScope = 'ACCOUNT_ALL';
    } else {
      const employee = await this.prisma.employee.findFirst({
        where: { accountId: user.accountId, userId: user.sub, deletedAt: null },
        select: { id: true, hrmRole: true, departmentId: true },
      });

      if (!employee) {
        throw new ForbiddenException(
          'Bu istifadəçiyə uyğun işçi qeydi tapılmadı',
        );
      }

      hrmEmployeeId = employee.id;
      hrmDeptId = employee.departmentId;

      if (employee.hrmRole === 'HR') {
        userScope = 'ACCOUNT_ALL';
      } else if (employee.hrmRole === 'MANAGER') {
        userScope = 'DEPT_ONLY';
      } else {
        userScope = 'SELF_ONLY';
      }
    }

    request.hrmScope = userScope;
    request.hrmEmployeeId = hrmEmployeeId;
    request.hrmDeptId = hrmDeptId;

    if (!allowedScopes.includes(userScope)) {
      throw new ForbiddenException('HRM icazəniz yetərli deyil');
    }

    return true;
  }
}
