import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvoicePaymentDto {
  @ApiProperty({ description: 'Payment amount in minor units (e.g. cents/qəpik)', minimum: 1 })
  @IsInt()
  @Min(1)
  amountMinor: number;

  @ApiProperty({ description: 'Date the payment was received (YYYY-MM-DD)' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ description: 'Payment method (e.g. Bank Transfer, Cash)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  method?: string;

  @ApiPropertyOptional({ description: 'Payment reference or transaction ID' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @ApiPropertyOptional({ description: 'Internal note about this payment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
