import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HrmScopes } from '../guards/hrm-scope.decorator';
import { HrmScopeGuard } from '../guards/hrm-scope.guard';
import { PayPayrollDto, RunPayrollDto } from './dto/run-payroll.dto';
import { PayrollService } from './payroll.service';

@ApiTags('HRM - Payroll')
@ApiBearerAuth()
@Controller('hrm/payroll')
@UseGuards(JwtAuthGuard, HrmScopeGuard)
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Post('run')
  @HrmScopes('ACCOUNT_ALL')
  run(@Body() dto: RunPayrollDto, @CurrentUser() user: JwtPayload) {
    return this.service.generate(user, dto);
  }

  @Get()
  @HrmScopes('ACCOUNT_ALL')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @HrmScopes('ACCOUNT_ALL')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user, id);
  }

  @Patch(':id/approve')
  @HrmScopes('ACCOUNT_ALL')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approve(user, id);
  }

  @Patch(':id/pay')
  @HrmScopes('ACCOUNT_ALL')
  pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayPayrollDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.pay(user, id, dto);
  }

  @Post('seed-accounts')
  @HttpCode(HttpStatus.OK)
  @HrmScopes('ACCOUNT_ALL')
  seedAccounts(@CurrentUser() user: JwtPayload) {
    return this.service.seedAccounts(user);
  }
}
