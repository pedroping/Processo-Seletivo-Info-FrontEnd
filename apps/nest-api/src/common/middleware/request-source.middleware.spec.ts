import { Logger } from '@nestjs/common';
import type { Response } from 'express';
import type { CustomRequest } from '../models/custom-request.model';
import { RequestSourceMiddleware } from './request-source.middleware';

type Headers = Record<string, string | undefined>;

const createRequest = (headers: Headers, ip?: string): CustomRequest =>
  ({
    headers,
    method: 'GET',
    url: '/vehicles',
    ip,
    socket: { remoteAddress: ip },
  }) as unknown as CustomRequest;

describe('RequestSourceMiddleware', () => {
  let middleware: RequestSourceMiddleware;
  let next: jest.Mock;
  const response = {} as Response;

  beforeEach(() => {
    middleware = new RequestSourceMiddleware();
    next = jest.fn();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tags a node user-agent as server (SSR)', () => {
    const req = createRequest({ 'user-agent': 'node' });

    middleware.use(req, response, next);

    expect(req.requestSource).toBe('server (SSR)');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('tags an axios user-agent as server (SSR)', () => {
    const req = createRequest({ 'user-agent': 'axios/1.6.0' });

    middleware.use(req, response, next);

    expect(req.requestSource).toBe('server (SSR)');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('tags a sec-fetch-mode request as browser', () => {
    const req = createRequest({ 'sec-fetch-mode': 'cors', 'user-agent': 'Mozilla/5.0' });

    middleware.use(req, response, next);

    expect(req.requestSource).toBe('browser');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('tags a sec-ch-ua request as browser', () => {
    const req = createRequest({ 'sec-ch-ua': '"Chromium";v="120"' });

    middleware.use(req, response, next);

    expect(req.requestSource).toBe('browser');
  });

  it('tags a loopback request without browser hints as server (SSR)', () => {
    const req = createRequest({ 'user-agent': 'Mozilla/5.0' }, '::ffff:127.0.0.1');

    middleware.use(req, response, next);

    expect(req.requestSource).toBe('server (SSR)');
  });

  it('falls back to browser (legacy/assumed) when nothing matches', () => {
    const req = createRequest({ 'user-agent': 'curl/8.0' }, '203.0.113.10');

    middleware.use(req, response, next);

    expect(req.requestSource).toBe('browser (legacy/assumed)');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs the method, url and source', () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const req = createRequest({ 'user-agent': 'node' });

    middleware.use(req, response, next);

    expect(log).toHaveBeenCalledWith('[GET] /vehicles - Source: server (SSR)');
  });

  it('always calls next()', () => {
    middleware.use(createRequest({}), response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
