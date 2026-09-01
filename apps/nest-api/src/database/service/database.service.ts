import { Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { DbSchema, EMPTY_DB } from '../../common/models/db-schema.model';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly dbPath = join(__dirname, 'assets', 'db.json');

  private queue: Promise<unknown> = Promise.resolve();

  async read(): Promise<DbSchema> {
    try {
      const data = await readFile(this.dbPath, 'utf8');
      return JSON.parse(data) as DbSchema;
    } catch (error) {
      this.logger.error('Error reading db.json:', error);
      return this.emptyDb();
    }
  }

  async write(data: DbSchema): Promise<void> {
    try {
      await writeFile(this.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      this.logger.error('Error writing to db.json:', error);
    }
  }

  runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(
      () => task(),
      () => task(),
    );

    this.queue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  private emptyDb(): DbSchema {
    return {
      ...EMPTY_DB,
      vehicles: [...EMPTY_DB.vehicles],
      brands: [...EMPTY_DB.brands],
      categories: [...EMPTY_DB.categories],
    };
  }
}
