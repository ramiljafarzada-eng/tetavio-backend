import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class BillLineDto {
  @ApiProperty({ example: 'Office supplies', description: 'Bill line item name' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  itemName!: string;

  @ApiPropertyOptional({ example: 'Printer paper and pens', description: 'Optional line description' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 2, description: 'Quantity. Must be greater than 0.' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ example: 5000, description: 'Unit price in minor currency units. Must be 0 or greater.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitPriceMinor!: number;
}
