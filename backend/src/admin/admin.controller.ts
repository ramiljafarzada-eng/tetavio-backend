import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AddNoteDto } from './dto/add-note.dto';
import { FlagAccountDto } from './dto/flag-account.dto';
import { ReviewAnomalyDto } from './dto/review-anomaly.dto';
import { UnflagAccountDto } from './dto/unflag-account.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('internal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide analytics overview (SUPER_ADMIN only)' })
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('system-health')
  @ApiOperation({ summary: 'System health status (SUPER_ADMIN only)' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Unified activity feed (SUPER_ADMIN only)' })
  getActivity(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getActivity(
      parseInt(page ?? '1', 10) || 1,
      parseInt(limit ?? '20', 10) || 20,
      type?.trim() || undefined,
      search?.trim() || undefined,
    );
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Paginated subscription list with summary (SUPER_ADMIN only)' })
  getSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getSubscriptions(
      parseInt(page ?? '1', 10) || 1,
      parseInt(limit ?? '20', 10) || 20,
      status?.trim() || undefined,
      search?.trim() || undefined,
    );
  }

  @Get('finance')
  @ApiOperation({ summary: 'Finance analytics dashboard (SUPER_ADMIN only)' })
  getFinance() {
    return this.adminService.getFinance();
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Anomaly detection report (SUPER_ADMIN only)' })
  getAnomalies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAnomalies(
      parseInt(page ?? '1', 10) || 1,
      parseInt(limit ?? '20', 10) || 20,
      severity?.trim() || undefined,
      type?.trim() || undefined,
      search?.trim() || undefined,
    );
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Paginated account list (SUPER_ADMIN only)' })
  getAccounts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAccounts(
      parseInt(page ?? '1', 10) || 1,
      parseInt(limit ?? '20', 10) || 20,
      search?.trim() || undefined,
    );
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Single account deep view (SUPER_ADMIN only)' })
  async getAccountById(@Param('id') id: string) {
    const result = await this.adminService.getAccountById(id);
    if (!result) throw new NotFoundException('Account not found');
    return result;
  }

  @Post('accounts/:id/notes')
  @ApiOperation({ summary: 'Add internal admin note to an account (SUPER_ADMIN only)' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.addNote(id, actor.sub, dto.note);
  }

  @Post('accounts/:id/flag')
  @ApiOperation({ summary: 'Flag an account for review (SUPER_ADMIN only)' })
  flagAccount(
    @Param('id') id: string,
    @Body() dto: FlagAccountDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.flagAccount(id, actor.sub, dto.reason);
  }

  @Post('accounts/:id/unflag')
  @ApiOperation({ summary: 'Clear active flags on an account (SUPER_ADMIN only)' })
  unflagAccount(
    @Param('id') id: string,
    @Body() dto: UnflagAccountDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.unflagAccount(id, actor.sub, dto.reason);
  }

  @Post('accounts/:id/grant-demo')
  @ApiOperation({ summary: 'Grant a fresh 14-day Demo trial to an account (SUPER_ADMIN only)' })
  grantDemo(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.grantDemo(id, actor.sub);
  }

  @Post('anomalies/review')
  @ApiOperation({ summary: 'Mark an anomaly as reviewed (SUPER_ADMIN only)' })
  reviewAnomaly(
    @Body() dto: ReviewAnomalyDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.reviewAnomaly(dto.accountId, dto.anomalyType, actor.sub, dto.note);
  }
}
