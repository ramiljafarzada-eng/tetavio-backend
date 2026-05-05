import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { trimString } from '../../../../common/utils/string-transform.util';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Mühasibat' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'ACC' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
