import { SupportThreadStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class ListSupportThreadsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: SupportThreadStatus })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsEnum(SupportThreadStatus)
  status?: SupportThreadStatus;

  @ApiPropertyOptional({ example: 'invoice' })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  search?: string;
}
