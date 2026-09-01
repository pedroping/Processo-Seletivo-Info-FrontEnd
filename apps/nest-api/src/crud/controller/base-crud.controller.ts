import { Body, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BaseEntity, DbEntity } from '../../common/models/db-schema.model';
import {
  CrudItemResponse,
  CrudMessageResponse,
  CrudPayload,
  CrudService,
} from '../service/crud.service';

export abstract class BaseCrudController<T extends BaseEntity> {
  protected abstract readonly entity: DbEntity;

  constructor(protected readonly crud: CrudService) {}

  @Get()
  findAll(): Promise<T[]> {
    return this.crud.findAll<T>(this.entity);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<T> {
    return this.crud.findOne<T>(this.entity, id);
  }

  @Post()
  create(@Body() payload: CrudPayload): Promise<CrudItemResponse<T>> {
    return this.crud.create<T>(this.entity, payload);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: CrudPayload): Promise<CrudItemResponse<T>> {
    return this.crud.update<T>(this.entity, id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<CrudMessageResponse> {
    return this.crud.remove(this.entity, id);
  }
}
