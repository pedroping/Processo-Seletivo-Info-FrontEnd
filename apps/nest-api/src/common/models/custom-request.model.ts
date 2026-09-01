import type { Request } from 'express';

export type RequestSource = 'unknown' | 'browser' | 'server (SSR)' | 'browser (legacy/assumed)';

export interface CustomRequest extends Request {
  requestSource?: RequestSource;
}

export type ClientIp = string | string[] | undefined;
