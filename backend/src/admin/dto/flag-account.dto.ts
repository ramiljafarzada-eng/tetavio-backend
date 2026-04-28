import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../common/utils/string-transform.util';

export class FlagAccountDto {
  @ApiProperty({ example: 'Suspected abuse of free tier limits.' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
