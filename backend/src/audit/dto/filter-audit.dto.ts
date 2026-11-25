import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterAuditDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'contacts' }) @IsOptional() @IsString() entity?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
}
