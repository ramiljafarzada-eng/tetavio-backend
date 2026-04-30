import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { CANONICAL_PLANS } from '../../../common/plan-catalog';

const DOWNGRADE_TARGETS = CANONICAL_PLANS.map((plan) => plan.code) as [
  string,
  ...string[],
];

export class DowngradeSubscriptionDto {
  @ApiProperty({ enum: DOWNGRADE_TARGETS, example: 'FREE' })
  @IsString()
  @IsIn(DOWNGRADE_TARGETS)
  targetPlanCode!: (typeof DOWNGRADE_TARGETS)[number];
}
