import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ManualAttendanceDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: '2026-05-05' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: '2026-05-05T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-05-05T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({
    example: 'PRESENT',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'SICK_LEAVE', 'BUSINESS_TRIP', 'HOLIDAY'],
  })
  @IsOptional()
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'SICK_LEAVE', 'BUSINESS_TRIP', 'HOLIDAY'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  employeeIds!: string[];

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  dateFrom!: string;

  @ApiProperty({ example: '2026-05-31' })
  @IsDateString()
  dateTo!: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @IsInt()
  tzOffsetMinutes?: number;

  @ApiPropertyOptional({
    example: 'ON_LEAVE',
    enum: ['ON_LEAVE', 'SICK_LEAVE', 'BUSINESS_TRIP', 'HOLIDAY'],
  })
  @IsOptional()
  @IsIn(['ON_LEAVE', 'SICK_LEAVE', 'BUSINESS_TRIP', 'HOLIDAY'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class ListAttendanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
