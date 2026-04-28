import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { trimString } from '../../common/utils/string-transform.util';

const VALID_ANOMALY_TYPES = [
  'INACTIVE_ACCOUNT',
  'HIGH_INVOICE_VOLUME',
  'EXPIRED_PAID_SUBSCRIPTION',
  'TRIAL_OR_FREE_WITH_USAGE',
  'NO_OWNER',
] as const;

export class ReviewAnomalyDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ enum: VALID_ANOMALY_TYPES })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsIn(VALID_ANOMALY_TYPES)
  anomalyType!: string;

  @ApiPropertyOptional({ example: 'Verified with customer — inactive due to seasonal slowdown.' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(2000)
  note?: string;
}
