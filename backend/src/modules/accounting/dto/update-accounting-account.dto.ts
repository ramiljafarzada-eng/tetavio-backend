import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class UpdateAccountingAccountDto {
  @ApiPropertyOptional({ example: '201' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(20)
  accountCode?: string;

  @ApiPropertyOptional({ example: 'Mallar' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(160)
  accountName?: string;

  @ApiPropertyOptional({ example: 'Aktiv' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(30)
  accountType?: string;

  @ApiPropertyOptional({ example: 'Aktiv' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  status?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
