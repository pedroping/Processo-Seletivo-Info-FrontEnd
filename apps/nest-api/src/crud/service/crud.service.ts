import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseEntity, DbEntity, DbSchema } from '../../common/models/db-schema.model';
import { DatabaseService } from '../../database/service/database.service';

export type CrudPayload = Record<string, unknown> & Partial<BaseEntity>;

export type CrudItem = Record<string, unknown> & BaseEntity;

export interface CrudMessageResponse {
  message: string;
}

export interface CrudItemResponse<T extends BaseEntity = BaseEntity> extends CrudMessageResponse {
  item: T;
}

@Injectable()
export class CrudService {
  constructor(private readonly database: DatabaseService) {}

  async findAll<T extends BaseEntity = BaseEntity>(entity: DbEntity): Promise<T[]> {
    const db = await this.database.read();

    return this.getCollection(db, entity) as T[];
  }

  async findOne<T extends BaseEntity = BaseEntity>(entity: DbEntity, id: string): Promise<T> {
    const db = await this.database.read();
    const item = this.getCollection(db, entity).find((current) => this.matchesId(current, id));

    if (!item) {
      throw this.notFound();
    }

    return item as T;
  }

  async create<T extends BaseEntity = BaseEntity>(
    entity: DbEntity,
    payload: CrudPayload,
  ): Promise<CrudItemResponse<T>> {
    return this.database.runExclusive(async () => {
      const db = await this.database.read();
      const items = this.getCollection(db, entity);
      const item: CrudItem = { ...payload, id: payload.id || Date.now().toString() };

      items.push(item);
      await this.database.write(db);

      return { message: 'Created', item: item as unknown as T };
    });
  }

  async update<T extends BaseEntity = BaseEntity>(
    entity: DbEntity,
    id: string,
    payload: CrudPayload,
  ): Promise<CrudItemResponse<T>> {
    return this.database.runExclusive(async () => {
      const db = await this.database.read();
      const items = this.getCollection(db, entity);
      const index = items.findIndex((current) => this.matchesId(current, id));

      if (index === -1) {
        throw this.notFound();
      }

      const item: CrudItem = { ...items[index], ...payload } as CrudItem;

      items[index] = item;
      await this.database.write(db);

      return { message: 'Updated', item: item as unknown as T };
    });
  }

  async remove(entity: DbEntity, id: string): Promise<CrudMessageResponse> {
    return this.database.runExclusive(async () => {
      const db = await this.database.read();
      const items = this.getCollection(db, entity);
      const remaining = items.filter((current) => !this.matchesId(current, id));

      if (remaining.length >= items.length) {
        throw this.notFound();
      }

      this.setCollection(db, entity, remaining);
      await this.database.write(db);

      return { message: 'Deleted' };
    });
  }

  private matchesId(item: BaseEntity, id: string): boolean {
    return String(item.id) === String(id);
  }

  private notFound(): HttpException {
    return new HttpException({ message: 'Not found' }, HttpStatus.NOT_FOUND);
  }

  private getCollection(db: DbSchema, entity: DbEntity): BaseEntity[] {
    return (db as Record<DbEntity, BaseEntity[]>)[entity];
  }

  private setCollection(db: DbSchema, entity: DbEntity, items: BaseEntity[]): void {
    (db as Record<DbEntity, BaseEntity[]>)[entity] = items;
  }
}
