import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @Post('import')
  import(@Body() dto: ImportContactsDto) {
    return this.contactsService.importMany(dto.rows);
  }

  @Get()
  findAll(@Query() dto: FilterContactsDto) {
    return this.contactsService.findAll(dto);
  }

  @Get('export')
  async export(@Query() dto: FilterContactsDto, @Res() res: Response) {
    const csv = await this.contactsService.exportCsv(dto);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('contacts.csv');
    res.send(csv);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.remove(id);
  }
}
