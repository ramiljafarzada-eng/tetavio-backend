import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'TERMINATED'])
  status?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
