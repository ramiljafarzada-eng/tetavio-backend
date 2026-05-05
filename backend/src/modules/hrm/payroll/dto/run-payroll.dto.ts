import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class RunPayrollDto {
  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ example: '2026-05-31' })
  @IsDateString()
  periodEnd!: string;
}

export class PayPayrollDto {
  @ApiProperty({ description: 'Ödəniş aparılacaq bank hesabının ID-si' })
  @IsUUID()
  bankAccountId!: string;
}
