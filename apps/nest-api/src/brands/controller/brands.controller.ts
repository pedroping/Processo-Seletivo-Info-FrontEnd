import { Controller } from '@nestjs/common';
import { Brand, DbEntity } from '../../common/models/db-schema.model';
import { BaseCrudController } from '../../crud/controller/base-crud.controller';
import { CrudService } from '../../crud/service/crud.service';

@Controller('brands')
export class BrandsController extends BaseCrudController<Brand> {
  protected readonly entity: DbEntity = 'brands';

  constructor(crud: CrudService) {
    super(crud);
  }
}
