import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

const MOCK_STATUSES = ['SUCCESS', 'FAILED'] as const;

export class MockWebhookDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId!: string;

  @ApiProperty()
  @IsString()
  gatewayPaymentId!: string;

  @ApiProperty({ enum: MOCK_STATUSES, example: 'SUCCESS' })
  @IsString()
  @IsIn(MOCK_STATUSES)
  status!: 'SUCCESS' | 'FAILED';

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  payload?: Record<string, unknown>;
}
