import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PashaWebhookDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId!: string;

  @ApiProperty({ example: 'payment.status.updated' })
  @IsString()
  eventType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatewayPaymentId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  payload?: Record<string, unknown>;
}
