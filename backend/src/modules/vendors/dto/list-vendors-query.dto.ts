import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { trimString } from '../../../common/utils/string-transform.util';

export const VENDOR_SORT_FIELDS = [
  'createdAt',
  'vendorName',
  'companyName',
  'email',
] as const;

export type VendorSortField = (typeof VENDOR_SORT_FIELDS)[number];

export class ListVendorsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by vendor name, company name, email, or phone',
    example: 'Service',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    enum: VENDOR_SORT_FIELDS,
    description: 'Allowed vendor sort field',
  })
  @IsOptional()
  @IsIn(VENDOR_SORT_FIELDS)
  sortBy?: VendorSortField;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
