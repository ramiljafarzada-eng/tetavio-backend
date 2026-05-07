import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CANONICAL_PLANS } from '../../../common/plan-catalog';

const UPGRADE_TARGETS = CANONICAL_PLANS
  .filter((plan) => plan.code !== 'FREE')
  .map((plan) => plan.code) as [string, ...string[]];

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: UPGRADE_TARGETS, example: 'STANDARD' })
  @IsString()
  @IsIn(UPGRADE_TARGETS)
  targetPlanCode!: (typeof UPGRADE_TARGETS)[number];

  @ApiPropertyOptional({ enum: ['monthly', 'annual'], default: 'monthly' })
  @IsOptional()
  @IsString()
  @IsIn(['monthly', 'annual'])
  billingCycle?: 'monthly' | 'annual';
}
