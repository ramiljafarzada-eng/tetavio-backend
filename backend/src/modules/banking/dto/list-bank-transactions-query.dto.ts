import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListBankTransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by bank account id' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ enum: ['INFLOW', 'OUTFLOW'], description: 'Filter by transaction type' })
  @IsOptional()
  @IsIn(['INFLOW', 'OUTFLOW'])
  type?: 'INFLOW' | 'OUTFLOW';

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Inclusive date lower bound' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30', description: 'Inclusive date upper bound' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
