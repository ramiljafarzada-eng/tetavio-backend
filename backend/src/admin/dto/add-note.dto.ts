import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../common/utils/string-transform.util';

export class AddNoteDto {
  @ApiProperty({ example: 'Account flagged for manual review during onboarding audit.' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note!: string;
}
