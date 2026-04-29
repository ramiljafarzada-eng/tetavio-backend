import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { trimAndUppercaseString, trimString } from '../../../common/utils/string-transform.util';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Main Bank', description: 'Display name for this bank account' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'AZN', description: 'Currency code (3 characters)' })
  @IsOptional()
  @Transform(({ value }) => trimAndUppercaseString(value))
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 0, description: 'Opening balance in minor units (default 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  openingBalanceMinor?: number;
}
