import { SupportThreadCategory, SupportThreadPriority } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class CreateSupportThreadDto {
  @ApiProperty({ example: 'Faktura yaradılmır' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @ApiProperty({ enum: SupportThreadCategory, example: SupportThreadCategory.TECHNICAL })
  @IsEnum(SupportThreadCategory)
  category!: SupportThreadCategory;

  @ApiProperty({ enum: SupportThreadPriority, example: SupportThreadPriority.NORMAL })
  @IsEnum(SupportThreadPriority)
  priority!: SupportThreadPriority;

  @ApiPropertyOptional({ example: 'dashboard / invoices' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(160)
  context?: string;

  @ApiProperty({ example: 'Faktura yarat düyməsinə basanda heç nə olmur.' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  body!: string;
}
