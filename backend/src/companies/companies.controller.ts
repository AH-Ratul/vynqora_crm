import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post() create(@Body() dto: CreateCompanyDto) { return this.companiesService.create(dto); }
  @Get() findAll(@Query() dto: PaginationDto) { return this.companiesService.findAll(dto); }
  @Get(':id') findOne(@Param('id') id: string) { return this.companiesService.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) { return this.companiesService.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.companiesService.remove(id); }
}
