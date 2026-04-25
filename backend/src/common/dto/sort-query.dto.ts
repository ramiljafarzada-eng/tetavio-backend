import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class SortQueryDto<TSortBy extends string = string> {
  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  sortBy?: TSortBy;
}
