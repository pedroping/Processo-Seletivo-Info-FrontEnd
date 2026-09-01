import { Controller } from '@nestjs/common';
import { Category, DbEntity } from '../../common/models/db-schema.model';
import { BaseCrudController } from '../../crud/controller/base-crud.controller';
import { CrudService } from '../../crud/service/crud.service';

@Controller('categories')
export class CategoriesController extends BaseCrudController<Category> {
  protected readonly entity: DbEntity = 'categories';

  constructor(crud: CrudService) {
    super(crud);
  }
}
