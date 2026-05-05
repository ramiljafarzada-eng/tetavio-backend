import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ example: '2026-05-05T09:05:00.000Z' })
  @IsDateString()
  checkIn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class CheckOutDto {
  @ApiProperty({ example: '2026-05-05T18:10:00.000Z' })
  @IsDateString()
  checkOut!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
