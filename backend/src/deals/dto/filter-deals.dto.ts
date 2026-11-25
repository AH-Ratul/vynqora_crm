import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DealStage } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterDealsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DealStage }) @IsOptional() @IsEnum(DealStage) stage?: DealStage;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() contactId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() companyId?: string;
}
