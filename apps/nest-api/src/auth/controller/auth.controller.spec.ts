import 'reflect-metadata';

import { HttpStatus, Logger } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS } from '../../common/constants/api.constants';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import type { CustomRequest } from '../../common/models/custom-request.model';
import { AuthController } from './auth.controller';
import { AuthService } from '../auth.service';

type RequestStub = Pick<CustomRequest, 'headers' | 'ip' | 'cookies'>;

const buildRequest = (overrides: Partial<RequestStub> = {}): CustomRequest =>
  ({
    headers: {},
    ip: '127.0.0.1',
    cookies: {},
    ...overrides,
  }) as CustomRequest;

const buildResponse = (): Response & { cookie: jest.Mock } =>
  ({ cookie: jest.fn() }) as unknown as Response & { cookie: jest.Mock };

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    createToken: jest.Mock;
    validateSession: jest.Mock;
    revealSecret: jest.Mock;
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    authService = {
      createToken: jest.fn().mockReturnValue('iv:encrypted'),
      validateSession: jest.fn().mockReturnValue({ message: 'Valid!' }),
      revealSecret: jest.fn().mockReturnValue({ message: 'Toop' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /login', () => {
    it('sets the TokenCookie with TOKEN_COOKIE_OPTIONS and returns { message: "Toop" }', () => {
      const req = buildRequest();
      const res = buildResponse();

      const result = controller.login(req, res, { password: 'Test123' });

      expect(authService.createToken).toHaveBeenCalledWith('127.0.0.1', 'Test123');
      expect(res.cookie).toHaveBeenCalledWith(TOKEN_COOKIE, 'iv:encrypted', TOKEN_COOKIE_OPTIONS);
      expect(result).toEqual({ message: 'Toop' });
    });

    it('prefers the x-forwarded-for header over req.ip', () => {
      const req = buildRequest({
        headers: { 'x-forwarded-for': '203.0.113.5' },
        ip: '127.0.0.1',
      });

      controller.login(req, buildResponse(), { password: 'Test123' });

      expect(authService.createToken).toHaveBeenCalledWith('203.0.113.5', 'Test123');
    });

    it('falls back to req.ip when x-forwarded-for is absent', () => {
      const req = buildRequest({ headers: {}, ip: '10.0.0.9' });

      controller.login(req, buildResponse(), { password: 'Test123' });

      expect(authService.createToken).toHaveBeenCalledWith('10.0.0.9', 'Test123');
    });

    it('forwards a missing password so the service can reject it', () => {
      controller.login(buildRequest(), buildResponse(), {});

      expect(authService.createToken).toHaveBeenCalledWith('127.0.0.1', undefined);
    });

    it('logs the created token IP through the Nest Logger', () => {
      const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

      controller.login(
        buildRequest({ headers: { 'x-forwarded-for': '203.0.113.5' } }),
        buildResponse(),
        { password: 'Test123' },
      );

      expect(log).toHaveBeenCalledWith('[Login] Token created for IP: 203.0.113.5');
    });
  });

  describe('GET /session', () => {
    it('passes the cookie and the current IP through to the service', () => {
      const req = buildRequest({
        cookies: { [TOKEN_COOKIE]: 'iv:encrypted' },
        headers: { 'x-forwarded-for': '203.0.113.5' },
      });

      expect(controller.session(req)).toEqual({ message: 'Valid!' });
      expect(authService.validateSession).toHaveBeenCalledWith('iv:encrypted', '203.0.113.5');
    });

    it('passes undefined when the cookie is absent and falls back to req.ip', () => {
      const req = buildRequest({ cookies: {}, ip: '127.0.0.1' });

      controller.session(req);

      expect(authService.validateSession).toHaveBeenCalledWith(undefined, '127.0.0.1');
    });
  });

  describe('GET /secret/:id', () => {
    it('delegates to the service', () => {
      expect(controller.getSecret('VERY_SECRET_VALUE')).toEqual({ message: 'Toop' });
      expect(authService.revealSecret).toHaveBeenCalledWith('VERY_SECRET_VALUE');
    });
  });

  describe('route metadata', () => {
    it('marks only /login and /secret/:id as public (mirrors `validateAuthCookie`)', () => {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.login)).toBe(true);
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.getSecret)).toBe(true);
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.session)).toBeUndefined();
    });

    it('answers /login with 200, not Nest’s default 201 for POST', () => {
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.login)).toBe(
        HttpStatus.OK,
      );
    });
  });
});
