import { ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenCookieGuard } from './token-cookie.guard';

const createContext = (cookies: Record<string, string> = {}): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class Anything {},
    switchToHttp: () => ({
      getRequest: () => ({ cookies, originalUrl: '/vehicles' }),
    }),
  }) as unknown as ExecutionContext;

describe('TokenCookieGuard', () => {
  let reflector: Reflector;
  let guard: TokenCookieGuard;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TokenCookieGuard(reflector);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lets a public handler through without any cookie', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it('throws a 401 HttpException with the Express-compatible body when the cookie is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createContext();
    let thrown: unknown;

    try {
      guard.canActivate(context);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);

    const exception = thrown as HttpException;
    expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(exception.getResponse()).toEqual({
      message: 'Unauthorized: TokenCookie is required',
    });

    expect(warn).toHaveBeenCalledWith('[Blocked] Access attempt to /vehicles without TokenCookie');
  });

  it('lets the request through when the TokenCookie is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(createContext({ TokenCookie: 'iv:payload' }))).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
});
