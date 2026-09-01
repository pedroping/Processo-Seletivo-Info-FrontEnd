import { Module } from '@nestjs/common';
import { CrudModule } from '../crud/crud.module';
import { BrandsController } from './controller/brands.controller';

@Module({
  imports: [CrudModule],
  controllers: [BrandsController],
})
export class BrandsModule {}
