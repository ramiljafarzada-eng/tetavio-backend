import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HrmScopes } from '../guards/hrm-scope.decorator';
import type { HrmRequestContext } from '../guards/hrm-scope.guard';
import { HrmScopeGuard } from '../guards/hrm-scope.guard';
import {
  CreateLeaveRequestDto,
  RejectLeaveDto,
} from './dto/create-leave-request.dto';
import { LeaveService } from './leave.service';

@ApiTags('HRM - Leave')
@ApiBearerAuth()
@Controller('hrm/leave-requests')
@UseGuards(JwtAuthGuard, HrmScopeGuard)
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Post()
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(user, dto);
  }

  @Get()
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  findAll(@Req() req: HrmRequestContext, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user, req);
  }

  @Get('my-balances')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  myBalances(@CurrentUser() user: JwtPayload) {
    return this.service.getMyBalances(user);
  }

  @Post('balances')
  @HrmScopes('ACCOUNT_ALL')
  upsertBalance(
    @Body() dto: { employeeId: string; leaveType: string; allocated: number; year?: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.upsertBalance(user, dto);
  }

  @Get('balances/:employeeId')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  balances(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getBalances(user, employeeId);
  }

  @Patch(':id/manager-approve')
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  managerApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approveByManager(id, user);
  }

  @Patch(':id/hr-approve')
  @HrmScopes('ACCOUNT_ALL')
  hrApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approveByHR(id, user);
  }

  @Patch(':id/reject')
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLeaveDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.reject(id, user, dto);
  }

  @Patch(':id/cancel')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cancel(id, user);
  }
}
