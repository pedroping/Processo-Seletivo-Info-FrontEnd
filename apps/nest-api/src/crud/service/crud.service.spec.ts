import { HttpException, HttpStatus } from '@nestjs/common';
import { Brand, DbSchema, Vehicle } from '../../common/models/db-schema.model';
import { DatabaseService } from '../database/database.service';
import { CrudService } from './crud.service';

interface DatabaseServiceMock {
  read: jest.Mock<Promise<DbSchema>, []>;
  write: jest.Mock<Promise<void>, [DbSchema]>;
  runExclusive: jest.Mock<Promise<unknown>, [() => Promise<unknown>]>;
}

const vehicle = (id: string | number, model = 'Huracán'): Vehicle =>
  ({ id, model }) as unknown as Vehicle;

const brand = (id: string, name = 'Lamborghini'): Brand => ({ id, name }) as Brand;

describe('CrudService', () => {
  let database: DatabaseServiceMock;
  let service: CrudService;
  let db: DbSchema;

  const givenDb = (data: Partial<DbSchema>): void => {
    db = { vehicles: [], brands: [], categories: [], ...data };
    database.read.mockResolvedValue(db);
  };

  beforeEach(() => {
    database = {
      read: jest.fn(),
      write: jest.fn().mockResolvedValue(undefined),
      runExclusive: jest.fn((task: () => Promise<unknown>) => task()),
    };

    service = new CrudService(database as unknown as DatabaseService);
    givenDb({});
  });

  const expectNotFound = async (promise: Promise<unknown>): Promise<void> => {
    await expect(promise).rejects.toBeInstanceOf(HttpException);

    const error: HttpException = await promise.then(
      () => {
        throw new Error('Expected the call to reject');
      },
      (rejection: HttpException) => rejection,
    );

    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toEqual({ message: 'Not found' });
    expect(Object.keys(error.getResponse() as object)).toEqual(['message']);
  };

  describe('findAll', () => {
    it('returns the raw collection', async () => {
      const items = [vehicle('1'), vehicle('2')];
      givenDb({ vehicles: items });

      await expect(service.findAll('vehicles')).resolves.toBe(items);
    });

    it('reads the collection of the requested entity', async () => {
      const brands = [brand('9')];
      givenDb({ vehicles: [vehicle('1')], brands });

      await expect(service.findAll('brands')).resolves.toBe(brands);
    });
  });

  describe('findOne', () => {
    it('returns the matching item', async () => {
      const target = vehicle('2');
      givenDb({ vehicles: [vehicle('1'), target] });

      await expect(service.findOne('vehicles', '2')).resolves.toBe(target);
    });

    it('matches a numeric db id against a string route param', async () => {
      const target = vehicle(12);
      givenDb({ vehicles: [target] });

      await expect(service.findOne('vehicles', '12')).resolves.toBe(target);
    });

    it('throws 404 with only a message when the item does not exist', async () => {
      givenDb({ vehicles: [vehicle('1')] });

      await expectNotFound(service.findOne('vehicles', '404'));
    });
  });

  describe('create', () => {
    it('generates an id when the payload has none, writes and answers Created', async () => {
      const now = 1758000000000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
      givenDb({ vehicles: [] });

      const result = await service.create('vehicles', { model: 'Aventador' });

      expect(result).toEqual({
        message: 'Created',
        item: { model: 'Aventador', id: now.toString() },
      });
      expect(db.vehicles).toEqual([{ model: 'Aventador', id: now.toString() }]);
      expect(database.write).toHaveBeenCalledWith(db);
      expect(database.runExclusive).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
    });

    it('preserves a supplied id', async () => {
      givenDb({ brands: [brand('1')] });

      const result = await service.create('brands', { id: 'custom', name: 'Ferrari' });

      expect(result).toEqual({ message: 'Created', item: { id: 'custom', name: 'Ferrari' } });
      expect(db.brands).toHaveLength(2);
      expect(database.write).toHaveBeenCalledWith(db);
    });
  });

  describe('update', () => {
    it('merges the payload into the existing record and answers Updated', async () => {
      givenDb({ vehicles: [vehicle('1', 'Huracán'), vehicle('2', 'Urus')] });

      const result = await service.update('vehicles', '2', { model: 'Urus Performante' });

      expect(result).toEqual({ message: 'Updated', item: { id: '2', model: 'Urus Performante' } });
      expect(db.vehicles[1]).toEqual({ id: '2', model: 'Urus Performante' });
      expect(db.vehicles[0]).toEqual({ id: '1', model: 'Huracán' });
      expect(database.write).toHaveBeenCalledWith(db);
      expect(database.runExclusive).toHaveBeenCalledTimes(1);
    });

    it('matches a numeric db id against a string route param', async () => {
      givenDb({ vehicles: [vehicle(12)] });

      const result = await service.update('vehicles', '12', { model: 'Revuelto' });

      expect(result).toEqual({ message: 'Updated', item: { id: 12, model: 'Revuelto' } });
    });

    it('throws 404 and does not write when the item does not exist', async () => {
      givenDb({ vehicles: [vehicle('1')] });

      await expectNotFound(service.update('vehicles', '404', { model: 'Nope' }));
      expect(database.write).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('writes the filtered collection and answers Deleted', async () => {
      givenDb({ vehicles: [vehicle('1'), vehicle('2')] });

      const result = await service.remove('vehicles', '1');

      expect(result).toEqual({ message: 'Deleted' });
      expect(db.vehicles).toEqual([{ id: '2', model: 'Huracán' }]);
      expect(database.write).toHaveBeenCalledWith(db);
      expect(database.runExclusive).toHaveBeenCalledTimes(1);
    });

    it('throws 404 and does not write when the item does not exist', async () => {
      givenDb({ vehicles: [vehicle('1')] });

      await expectNotFound(service.remove('vehicles', '404'));
      expect(db.vehicles).toHaveLength(1);
      expect(database.write).not.toHaveBeenCalled();
    });
  });
});
