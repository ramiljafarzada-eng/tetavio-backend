import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { trimString } from '../../../common/utils/string-transform.util';

export const BILL_SORT_FIELDS = [
  'issueDate',
  'dueDate',
  'createdAt',
  'billNumber',
  'totalMinor',
  'status',
] as const;

export type BillSortField = (typeof BILL_SORT_FIELDS)[number];

export class ListBillsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by bill number', example: 'BILL-000001' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ example: 'DRAFT', description: 'Filter by bill status' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  status?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by vendor id' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Inclusive issue date lower bound' })
  @IsOptional()
  @IsDateString()
  issueDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30', description: 'Inclusive issue date upper bound' })
  @IsOptional()
  @IsDateString()
  issueDateTo?: string;

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Inclusive due date lower bound' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-05-31', description: 'Inclusive due date upper bound' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ enum: BILL_SORT_FIELDS, description: 'Sort field' })
  @IsOptional()
  @IsIn(BILL_SORT_FIELDS)
  sortBy?: BillSortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Sort direction' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
