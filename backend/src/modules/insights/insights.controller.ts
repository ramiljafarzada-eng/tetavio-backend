import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@ApiTags('Insights')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('financial')
  @ApiOperation({ summary: 'Financial insights for the authenticated account' })
  getFinancialInsights(@CurrentUser() user: JwtPayload) {
    return this.insightsService.getFinancialInsights(user.accountId);
  }
}
