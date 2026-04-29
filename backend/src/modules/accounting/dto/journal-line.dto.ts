import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class JournalLineDto {
  @ApiProperty({ example: '201', description: 'Account code to look up the accounting account' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountCode!: string;

  @ApiProperty({ enum: ['Debet', 'Kredit'] })
  @IsIn(['Debet', 'Kredit'])
  entryType!: 'Debet' | 'Kredit';

  @ApiProperty({ example: 1000, description: 'Amount in account currency units (not minor)' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'goods', description: 'Subledger category (stored as description)' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(120)
  subledgerCategory?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(60)
  linkedEntityType?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(60)
  linkedEntityId?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(160)
  linkedEntityName?: string;
}
