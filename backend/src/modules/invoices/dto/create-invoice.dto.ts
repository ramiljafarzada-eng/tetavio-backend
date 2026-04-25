import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { InvoiceLineDto } from './invoice-line.dto';
import { trimAndUppercaseString, trimString } from '../../../common/utils/string-transform.util';

export class CreateInvoiceDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Customer id for the invoice. Must belong to the authenticated account.',
  })
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional({
    example: 'INV-2026-001',
    description:
      'Optional invoice number. If omitted, backend auto-generates an account-scoped value.',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(80)
  invoiceNumber?: string;

  @ApiPropertyOptional({
    example: 'DRAFT',
    description: 'Invoice status label',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  status?: string;

  @ApiProperty({
    example: '2026-04-25',
    description: 'Invoice issue date (ISO date)',
  })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({
    example: '2026-05-25',
    description: 'Invoice due date (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    example: 'AZN',
    description: 'Invoice currency code',
  })
  @IsOptional()
  @Transform(({ value }) => trimAndUppercaseString(value))
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    example: 'Ayliq xidmet fakturasi',
    description: 'Optional invoice note visible in the ERP record',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    type: [InvoiceLineDto],
    description:
      'Invoice lines. Backend calculates line totals and invoice totals from these values.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];
}
