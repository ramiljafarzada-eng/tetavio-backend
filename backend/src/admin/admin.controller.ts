import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

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
}
