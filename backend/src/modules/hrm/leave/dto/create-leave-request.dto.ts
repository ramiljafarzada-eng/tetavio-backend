import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum LeaveTypeDto {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER',
}

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveTypeDto })
  @IsEnum(LeaveTypeDto)
  leaveType!: LeaveTypeDto;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-07' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RejectLeaveDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
