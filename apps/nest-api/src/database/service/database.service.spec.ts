import { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { DbSchema, EMPTY_DB } from '../../common/models/db-schema.model';
import { DatabaseService } from './database.service';

jest.mock('fs/promises');

const readFileMock = readFile as jest.MockedFunction<typeof readFile>;
const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    service = new DatabaseService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('read', () => {
    it('parses the JSON contents of db.json', async () => {
      const db: DbSchema = {
        vehicles: [],
        brands: [{ id: '1', name: 'Fiat' }],
        categories: [{ id: '2', description: 'SUV' }],
      };

      readFileMock.mockResolvedValue(JSON.stringify(db) as never);

      await expect(service.read()).resolves.toEqual(db);
      expect(readFileMock).toHaveBeenCalledWith(expect.stringContaining('db.json'), 'utf8');
    });

    it('returns the empty schema when reading fails', async () => {
      readFileMock.mockRejectedValue(new Error('ENOENT') as never);

      await expect(service.read()).resolves.toEqual(EMPTY_DB);
    });

    it('returns the empty schema when the file contains invalid JSON', async () => {
      readFileMock.mockResolvedValue('not-json' as never);

      await expect(service.read()).resolves.toEqual(EMPTY_DB);
    });

    it('returns a detached copy so callers cannot mutate EMPTY_DB', async () => {
      readFileMock.mockRejectedValue(new Error('ENOENT') as never);

      const first = await service.read();
      first.vehicles.push({
        id: '1',
        licensePlate: 'AAA-0000',
        chassi: 'c',
        renavam: 'r',
        model: 'm',
        carBrand: 1,
        year: 2020,
        category: 1,
        image: '',
      });

      expect(EMPTY_DB.vehicles).toHaveLength(0);
      await expect(service.read()).resolves.toEqual(EMPTY_DB);
    });
  });

  describe('write', () => {
    it('stringifies the payload with a 2-space indent', async () => {
      const db: DbSchema = { ...EMPTY_DB, brands: [{ id: '1', name: 'Fiat' }] };

      writeFileMock.mockResolvedValue(undefined as never);

      await service.write(db);

      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining('db.json'),
        JSON.stringify(db, null, 2),
      );
    });

    it('swallows write errors', async () => {
      writeFileMock.mockRejectedValue(new Error('EACCES') as never);

      await expect(service.write(EMPTY_DB)).resolves.toBeUndefined();
    });
  });

  describe('runExclusive', () => {
    const defer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    it('serializes overlapping tasks', async () => {
      const order: string[] = [];

      const slow = service.runExclusive(async () => {
        order.push('first:start');
        await defer(30);
        order.push('first:end');
      });

      const fast = service.runExclusive(async () => {
        order.push('second:start');
        await defer(1);
        order.push('second:end');
      });

      await Promise.all([slow, fast]);

      expect(order).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
    });

    it('resolves with the task result', async () => {
      await expect(service.runExclusive(async () => 42)).resolves.toBe(42);
    });

    it('does not poison the chain when a task rejects', async () => {
      const failure = service.runExclusive(async () => {
        throw new Error('boom');
      });

      await expect(failure).rejects.toThrow('boom');
      await expect(service.runExclusive(async () => 'still works')).resolves.toBe('still works');
    });

    it('keeps running later tasks queued behind a rejecting one', async () => {
      const order: string[] = [];

      const failure = service.runExclusive(async () => {
        order.push('failing');
        await defer(20);
        throw new Error('boom');
      });

      const next = service.runExclusive(async () => {
        order.push('next');
      });

      await expect(failure).rejects.toThrow('boom');
      await next;

      expect(order).toEqual(['failing', 'next']);
    });
  });
});
