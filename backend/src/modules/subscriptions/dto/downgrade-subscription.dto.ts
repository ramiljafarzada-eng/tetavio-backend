import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

const DOWNGRADE_TARGETS = ['FREE', 'PRO_MONTHLY'] as const;

export class DowngradeSubscriptionDto {
  @ApiProperty({ enum: DOWNGRADE_TARGETS, example: 'FREE' })
  @IsString()
  @IsIn(DOWNGRADE_TARGETS)
  targetPlanCode!: 'FREE' | 'PRO_MONTHLY';
}
