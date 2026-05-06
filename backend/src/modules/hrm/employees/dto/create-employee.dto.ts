import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../../../common/utils/string-transform.util';

export enum EmploymentTypeDto {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ramil' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Cəfərzadə' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'ramil@company.az' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '+994501234567' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'AA1234567' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ example: '123-45-6789' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  ssn?: string;

  @ApiPropertyOptional({ example: 'AZ12 NABZ 0000 0000 0000 0000 01' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  positionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workScheduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: EmploymentTypeDto, example: 'FULL_TIME' })
  @IsEnum(EmploymentTypeDto)
  employmentType!: EmploymentTypeDto;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: 150000, description: 'Qəpik ilə (1500.00 AZN = 150000)' })
  @IsInt()
  @Min(0)
  baseSalaryMinor!: number;

  @ApiPropertyOptional({ example: 'EMPLOYEE', enum: ['EMPLOYEE', 'MANAGER', 'HR'] })
  @IsOptional()
  @IsIn(['EMPLOYEE', 'MANAGER', 'HR'])
  hrmRole?: string;
}
