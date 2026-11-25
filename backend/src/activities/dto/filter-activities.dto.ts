import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ActivityType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterActivitiesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() contactId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() dealId?: string;
  @ApiPropertyOptional({ enum: ActivityType }) @IsOptional() @IsEnum(ActivityType) type?: ActivityType;
}
