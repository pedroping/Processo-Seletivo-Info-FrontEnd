import { Controller } from '@nestjs/common';
import { DbEntity, Vehicle } from '../../common/models/db-schema.model';
import { BaseCrudController } from '../../crud/controller/base-crud.controller';
import { CrudService } from '../../crud/service/crud.service';

@Controller('vehicles')
export class VehiclesController extends BaseCrudController<Vehicle> {
  protected readonly entity: DbEntity = 'vehicles';

  constructor(crud: CrudService) {
    super(crud);
  }
}
