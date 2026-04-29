import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trimAndUppercaseString, trimString } from '../../../common/utils/string-transform.util';

export class UpdateBankAccountDto {
  @ApiPropertyOptional({ example: 'Savings Account', description: 'Display name for this bank account' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code (3 characters)' })
  @IsOptional()
  @Transform(({ value }) => trimAndUppercaseString(value))
  @IsString()
  @Length(3, 3)
  currency?: string;
}
