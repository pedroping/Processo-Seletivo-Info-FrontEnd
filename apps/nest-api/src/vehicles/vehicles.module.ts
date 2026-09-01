import { Module } from '@nestjs/common';
import { CrudModule } from '../crud/crud.module';
import { VehiclesController } from './controller/vehicles.controller';

@Module({
  imports: [CrudModule],
  controllers: [VehiclesController],
})
export class VehiclesModule {}
