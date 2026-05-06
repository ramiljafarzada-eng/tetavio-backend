import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export enum POStatusDto {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIAL = 'PARTIAL',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export class CreatePOItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  qtyOrdered!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  unitCostMinor!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiProperty()
  @IsString()
  supplierName!: string;

  @ApiProperty()
  @IsDateString()
  orderDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [CreatePOItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePOItemDto)
  items!: CreatePOItemDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({ enum: POStatusDto })
  @IsOptional()
  @IsEnum(POStatusDto)
  status?: POStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;
}

export class ReceivePOItemDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  qtyReceived!: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceivePOItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePOItemDto)
  items!: ReceivePOItemDto[];
}
