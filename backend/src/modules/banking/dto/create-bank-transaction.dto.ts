import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class CreateBankTransactionDto {
  @ApiProperty({ format: 'uuid', description: 'Bank account id. Must belong to the authenticated account.' })
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty({ enum: ['INFLOW', 'OUTFLOW'], description: 'Transaction direction' })
  @IsIn(['INFLOW', 'OUTFLOW'])
  type!: 'INFLOW' | 'OUTFLOW';

  @ApiProperty({ example: 50000, description: 'Amount in minor currency units. Must be greater than 0.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @ApiProperty({ example: '2026-04-29', description: 'Transaction date (ISO date)' })
  @IsDateString()
  transactionDate!: string;

  @ApiPropertyOptional({ example: 'Payment from client', description: 'Optional description' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'REF-001', description: 'Optional reference number' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  reference?: string;
}
