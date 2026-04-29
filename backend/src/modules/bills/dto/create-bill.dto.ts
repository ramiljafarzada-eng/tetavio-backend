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
import { BillLineDto } from './bill-line.dto';
import { trimAndUppercaseString, trimString } from '../../../common/utils/string-transform.util';

export class CreateBillDto {
  @ApiProperty({ format: 'uuid', description: 'Vendor id for the bill. Must belong to the authenticated account.' })
  @IsUUID()
  vendorId!: string;

  @ApiPropertyOptional({ example: 'BILL-2026-001', description: 'Optional bill number. If omitted, backend auto-generates.' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(80)
  billNumber?: string;

  @ApiPropertyOptional({ example: 'DRAFT', description: 'Bill status' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  status?: string;

  @ApiProperty({ example: '2026-04-25', description: 'Bill issue date (ISO date)' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: '2026-05-25', description: 'Bill due date (ISO date)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'AZN', description: 'Bill currency code' })
  @IsOptional()
  @Transform(({ value }) => trimAndUppercaseString(value))
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 'Monthly vendor invoice', description: 'Optional notes' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ type: [BillLineDto], description: 'Bill lines. Backend calculates totals.' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BillLineDto)
  lines!: BillLineDto[];
}
