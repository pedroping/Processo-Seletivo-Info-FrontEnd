import { Module } from '@nestjs/common';
import { CrudModule } from '../crud/crud.module';
import { CategoriesController } from './controller/categories.controller';

@Module({
  imports: [CrudModule],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
