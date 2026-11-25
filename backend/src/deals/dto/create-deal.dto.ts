import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { DealStage } from '@prisma/client';

export class CreateDealDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() value?: number;
  @ApiPropertyOptional({ enum: DealStage }) @IsOptional() @IsEnum(DealStage) stage?: DealStage;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) probability?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() expectedCloseDate?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty() @IsUUID() contactId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() companyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() leadId?: string;
}
