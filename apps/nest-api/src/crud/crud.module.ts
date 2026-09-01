import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CrudService } from './service/crud.service';

@Module({
  imports: [DatabaseModule],
  providers: [CrudService],
  exports: [CrudService],
})
export class CrudModule {}
