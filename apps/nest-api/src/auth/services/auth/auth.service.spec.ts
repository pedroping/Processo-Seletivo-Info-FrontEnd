import { HttpException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenPayload, TokenService } from '../token/token.service';

const expectHttpException = (fn: () => unknown, status: number, body: object): void => {
  let thrown: unknown;

  try {
    fn();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(HttpException);

  const exception = thrown as HttpException;

  expect(exception.getStatus()).toBe(status);
  expect(exception.getResponse()).toEqual(body);
};

describe('AuthService', () => {
  const originalSecret = process.env['VERY_SECRET'];
  let tokenService: TokenService;
  let service: AuthService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    tokenService = new TokenService();
    service = new AuthService(tokenService);
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalSecret === undefined) {
      delete process.env['VERY_SECRET'];
    } else {
      process.env['VERY_SECRET'] = originalSecret;
    }
  });

  describe('createToken', () => {
    it('throws 400 { message: "Password required" } when the password is missing', () => {
      expectHttpException(() => service.createToken('127.0.0.1', undefined), 400, {
        message: 'Password required',
      });
    });

    it('throws 400 { message: "Password required" } when the password is empty', () => {
      expectHttpException(() => service.createToken('127.0.0.1', ''), 400, {
        message: 'Password required',
      });
    });

    it('returns a decryptable token carrying the ip, password and creation date', () => {
      const before = Date.now();
      const token = service.createToken('192.168.0.10', 'Test123');
      const payload = tokenService.decrypt(token) as TokenPayload;

      expect(payload).not.toBeNull();
      expect(payload.ip).toBe('192.168.0.10');
      expect(payload.pass).toBe('Test123');
      expect(payload.createdAt).toBeGreaterThanOrEqual(before);
    });

    it('keeps an x-forwarded-for list intact inside the payload', () => {
      const token = service.createToken(['203.0.113.5', '10.0.0.7'], 'Test123');

      expect(tokenService.decrypt(token)?.ip).toEqual(['203.0.113.5', '10.0.0.7']);
    });
  });

  describe('validateSession', () => {
    it('throws 401 { message: "No cookie found" } without a cookie', () => {
      expectHttpException(() => service.validateSession(undefined, '127.0.0.1'), 401, {
        message: 'No cookie found',
      });

      expectHttpException(() => service.validateSession('', '127.0.0.1'), 401, {
        message: 'No cookie found',
      });
    });

    it('throws 401 { message: "Invalid Token" } when the cookie cannot be decrypted', () => {
      expectHttpException(() => service.validateSession('garbage', '127.0.0.1'), 401, {
        message: 'Invalid Token',
      });
    });

    it('returns Valid! when the first character of both IPs matches', () => {
      const token = tokenService.encrypt({ ip: '192.168.0.10', pass: 'Test123' });

      expect(service.validateSession(token, '199.99.99.99')).toEqual({ message: 'Valid!' });
    });

    it('throws 401 { message: "IP Address mismatch! Token stolen?" } on a genuine mismatch', () => {
      const token = tokenService.encrypt({ ip: '10.0.0.1', pass: 'Test123' });

      expectHttpException(() => service.validateSession(token, '203.0.113.5'), 401, {
        message: 'IP Address mismatch! Token stolen?',
      });
    });

    it('throws 401 (not 500) when the token IP is a list that does not contain the current IP', () => {
      const token = tokenService.encrypt({ ip: ['10.0.0.1'], pass: 'Test123' });

      expectHttpException(() => service.validateSession(token, '203.0.113.5'), 401, {
        message: 'IP Address mismatch! Token stolen?',
      });
    });

    it('throws 401 when the token has no IP at all', () => {
      const token = tokenService.encrypt({ pass: 'Test123' });

      expectHttpException(() => service.validateSession(token, '203.0.113.5'), 401, {
        message: 'IP Address mismatch! Token stolen?',
      });
    });

    it('returns Valid! when the token IP contains the current IP prefix', () => {
      const token = tokenService.encrypt({ ip: '203.0.113.5, 10.0.0.7', pass: 'Test123' });

      expect(service.validateSession(token, '10.0.0.7')).toEqual({ message: 'Valid!' });
    });

    it('returns Valid! when the token IP list contains the current IP', () => {
      const token = tokenService.encrypt({ ip: ['203.0.113.5', '10.0.0.7'], pass: 'Test123' });

      expect(service.validateSession(token, '10.0.0.7')).toEqual({ message: 'Valid!' });
    });

    it('returns Valid! for the exact same IP', () => {
      const token = tokenService.encrypt({ ip: '127.0.0.1', pass: 'Test123' });

      expect(service.validateSession(token, '127.0.0.1')).toEqual({ message: 'Valid!' });
    });
  });

  describe('revealSecret', () => {
    it('returns { message: "Toop" } for the configured VERY_SECRET', () => {
      process.env['VERY_SECRET'] = 'VERY_SECRET_VALUE';

      expect(service.revealSecret('VERY_SECRET_VALUE')).toEqual({ message: 'Toop' });
    });

    it('throws 404 { message: "Not found" } for anything else', () => {
      process.env['VERY_SECRET'] = 'VERY_SECRET_VALUE';

      expectHttpException(() => service.revealSecret('nope'), 404, { message: 'Not found' });
    });
  });
});
