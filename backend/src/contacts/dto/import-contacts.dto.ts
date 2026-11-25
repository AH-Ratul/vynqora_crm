import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class ImportContactsDto {
  @ApiProperty({ type: [CreateContactDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  rows: CreateContactDto[];
}
