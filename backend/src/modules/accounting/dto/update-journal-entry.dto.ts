import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';
import { JournalLineDto } from './journal-line.dto';

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ example: 'MJ-0001' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(30)
  journalNumber?: string;

  @ApiPropertyOptional({ example: 'INV-001 ödənişi' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ type: [JournalLineDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  journalLines?: JournalLineDto[];
}
