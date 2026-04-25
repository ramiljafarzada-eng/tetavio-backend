import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class InvoiceLineDto {
  @ApiProperty({
    example: 'Abunelik xidmeti',
    description: 'Invoice line title or item label',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  itemName!: string;

  @ApiPropertyOptional({
    example: 'Aprel 2026 ayliq xidmet',
    description: 'Optional invoice line description',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'Quantity. Must be greater than 0.',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({
    example: 2500,
    description: 'Unit price in minor currency units. Must be 0 or greater.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitPriceMinor!: number;

  @ApiPropertyOptional({
    example: 'VAT18',
    description: 'Optional tax code label',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @ApiPropertyOptional({
    example: 18,
    description: 'Optional tax rate percentage. Backend calculates tax and line totals.',
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number | null;
}
