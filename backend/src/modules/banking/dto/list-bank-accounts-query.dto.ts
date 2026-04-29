import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { trimString } from '../../../common/utils/string-transform.util';

export class ListBankAccountsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by bank account name', example: 'Main' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  search?: string;
}
