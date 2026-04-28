import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../common/utils/string-transform.util';

export class UnflagAccountDto {
  @ApiPropertyOptional({ example: 'Issue resolved after customer support review.' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(500)
  reason?: string;
}
