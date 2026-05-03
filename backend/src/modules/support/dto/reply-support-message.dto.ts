import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class ReplySupportMessageDto {
  @ApiProperty({ example: 'Xəta davam edir, ekran görüntüsünü də əlavə etdim.' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
