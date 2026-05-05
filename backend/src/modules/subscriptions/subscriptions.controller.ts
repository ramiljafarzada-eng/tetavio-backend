import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DowngradeSubscriptionDto } from './dto/downgrade-subscription.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscription')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription details' })
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getCurrent(user);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Create upgrade order for paid target plan' })
  @ApiBody({ type: UpgradeSubscriptionDto })
  upgrade(@CurrentUser() user: JwtPayload, @Body() dto: UpgradeSubscriptionDto) {
    return this.subscriptionsService.upgrade(user, dto);
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Schedule downgrade at current period end' })
  @ApiBody({ type: DowngradeSubscriptionDto })
  downgrade(@CurrentUser() user: JwtPayload, @Body() dto: DowngradeSubscriptionDto) {
    return this.subscriptionsService.downgrade(user, dto);
  }

  @Post('switch-to-demo')
  @ApiOperation({ summary: 'Switch from free plan to 14-day demo plan' })
  switchToDemo(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.switchToDemo(user);
  }

  @Post('cancel-scheduled-change')
  @ApiOperation({ summary: 'Cancel scheduled downgrade/change' })
  cancelScheduledChange(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.cancelScheduledChange(user);
  }

  @Post('switch-to-free')
  @ApiOperation({ summary: 'Immediately switch subscription to permanent Free plan' })
  switchToFree(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.switchToFree(user);
  }

}
