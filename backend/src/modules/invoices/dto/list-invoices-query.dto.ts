import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { trimString } from '../../../common/utils/string-transform.util';

export const INVOICE_SORT_FIELDS = [
  'issueDate',
  'dueDate',
  'createdAt',
  'invoiceNumber',
  'totalMinor',
  'status',
] as const;

export type InvoiceSortField = (typeof INVOICE_SORT_FIELDS)[number];

export class ListInvoicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by invoice number',
    example: 'INV-000001',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({
    example: 'DRAFT',
    description: 'Filter by invoice status',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  status?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter by customer id',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Inclusive issue date lower bound',
  })
  @IsOptional()
  @IsDateString()
  issueDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description: 'Inclusive issue date upper bound',
  })
  @IsOptional()
  @IsDateString()
  issueDateTo?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Inclusive due date lower bound',
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Inclusive due date upper bound',
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({
    enum: INVOICE_SORT_FIELDS,
    description: 'Allowed invoice sort field',
  })
  @IsOptional()
  @IsIn(INVOICE_SORT_FIELDS)
  sortBy?: InvoiceSortField;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
