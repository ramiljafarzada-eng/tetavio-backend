import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

const UPGRADE_TARGETS = ['PRO_MONTHLY', 'PREMIUM_MONTHLY'] as const;

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: UPGRADE_TARGETS, example: 'PRO_MONTHLY' })
  @IsString()
  @IsIn(UPGRADE_TARGETS)
  targetPlanCode!: 'PRO_MONTHLY' | 'PREMIUM_MONTHLY';
}
