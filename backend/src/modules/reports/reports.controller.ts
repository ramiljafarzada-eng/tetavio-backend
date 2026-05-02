import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('accounts-receivable-aging')
  @ApiOperation({ summary: 'Accounts receivable aging report for authenticated account' })
  getAccountsReceivableAging(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getAccountsReceivableAging(user.accountId);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Trial balance from journal entries for authenticated account' })
  getTrialBalance(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getTrialBalance(user.accountId);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss report for authenticated account' })
  getProfitLoss(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getProfitLoss(user.accountId);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance sheet report for authenticated account' })
  getBalanceSheet(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getBalanceSheet(user.accountId);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Cash flow report for authenticated account' })
  getCashFlow(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getCashFlow(user.accountId);
  }
}
