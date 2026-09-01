import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { MetadataScanner } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CrudService } from '../../crud/service/crud.service';
import { VehiclesController } from './vehicles.controller';

interface CrudServiceMock {
  findAll: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
}

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let crud: CrudServiceMock;

  beforeEach(async () => {
    crud = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: '1' }),
      create: jest.fn().mockResolvedValue({ message: 'Created', item: { id: '1' } }),
      update: jest.fn().mockResolvedValue({ message: 'Updated', item: { id: '1' } }),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: CrudService, useValue: crud }],
    }).compile();

    controller = moduleRef.get<VehiclesController>(VehiclesController);
  });

  it('is instantiated by Nest with the injected CrudService', () => {
    expect(controller).toBeInstanceOf(VehiclesController);
  });

  it('delegates findAll to the vehicles collection', async () => {
    await expect(controller.findAll()).resolves.toEqual([]);
    expect(crud.findAll).toHaveBeenCalledWith('vehicles');
  });

  it('delegates findOne with the route id', async () => {
    await expect(controller.findOne('7')).resolves.toEqual({ id: '1' });
    expect(crud.findOne).toHaveBeenCalledWith('vehicles', '7');
  });

  it('delegates create with the body', async () => {
    await expect(controller.create({ model: 'Urus' })).resolves.toEqual({
      message: 'Created',
      item: { id: '1' },
    });
    expect(crud.create).toHaveBeenCalledWith('vehicles', { model: 'Urus' });
  });

  it('delegates update with the route id and the body', async () => {
    await expect(controller.update('7', { model: 'Urus' })).resolves.toEqual({
      message: 'Updated',
      item: { id: '1' },
    });
    expect(crud.update).toHaveBeenCalledWith('vehicles', '7', { model: 'Urus' });
  });

  it('delegates remove with the route id', async () => {
    await expect(controller.remove('7')).resolves.toEqual({ message: 'Deleted' });
    expect(crud.remove).toHaveBeenCalledWith('vehicles', '7');
  });

  describe('route metadata inherited from BaseCrudController', () => {
    const prototype = VehiclesController.prototype;

    const routeOf = (method: keyof VehiclesController) => {
      const handler = prototype[method] as unknown as object;

      return {
        path: Reflect.getMetadata(PATH_METADATA, handler),
        method: Reflect.getMetadata(METHOD_METADATA, handler),
      };
    };

    it('exposes the vehicles controller prefix', () => {
      expect(Reflect.getMetadata(PATH_METADATA, VehiclesController)).toBe('vehicles');
    });

    it('is discovered by the same scanner Nest uses to build routes', () => {
      const methods = new MetadataScanner().getAllMethodNames(prototype);

      expect(methods).toEqual(
        expect.arrayContaining(['findAll', 'findOne', 'create', 'update', 'remove']),
      );
      expect(methods.indexOf('findAll')).toBeLessThan(methods.indexOf('findOne'));
    });

    it('keeps the HTTP verbs and paths of the base class', () => {
      expect(routeOf('findAll')).toEqual({ path: '/', method: RequestMethod.GET });
      expect(routeOf('findOne')).toEqual({ path: ':id', method: RequestMethod.GET });
      expect(routeOf('create')).toEqual({ path: '/', method: RequestMethod.POST });
      expect(routeOf('update')).toEqual({ path: ':id', method: RequestMethod.PUT });
      expect(routeOf('remove')).toEqual({ path: ':id', method: RequestMethod.DELETE });
    });

    it('resolves the inherited @Param/@Body metadata from the subclass', () => {
      const args = (method: string): object =>
        Reflect.getMetadata(ROUTE_ARGS_METADATA, VehiclesController, method) as object;

      expect(Object.keys(args('findOne'))).toHaveLength(1);
      expect(Object.keys(args('create'))).toHaveLength(1);
      expect(Object.keys(args('update'))).toHaveLength(2);
      expect(Object.keys(args('remove'))).toHaveLength(1);
    });
  });
});
