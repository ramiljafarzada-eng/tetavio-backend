import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { trimString } from '../../../common/utils/string-transform.util';

export const CUSTOMER_SORT_FIELDS = [
  'createdAt',
  'displayName',
  'companyName',
  'email',
] as const;

export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export class ListCustomersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by display name, company name, email, or phone',
    example: 'Ali',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    enum: CUSTOMER_SORT_FIELDS,
    description: 'Allowed customer sort field',
  })
  @IsOptional()
  @IsIn(CUSTOMER_SORT_FIELDS)
  sortBy?: CustomerSortField;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
