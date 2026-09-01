import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { CustomRequest, RequestSource } from '../models/custom-request.model';

const LOOPBACK_IPS = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];

@Injectable()
export class RequestSourceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSourceMiddleware.name);

  use(req: CustomRequest, _res: Response, next: NextFunction): void {
    const userAgent = req.headers['user-agent'] || '';
    const secFetch = req.headers['sec-fetch-mode'];
    const clientIp = req.ip || req.socket?.remoteAddress;

    let source: RequestSource = 'unknown';

    if (secFetch || req.headers['sec-ch-ua']) {
      source = 'browser';
    } else if (clientIp && LOOPBACK_IPS.includes(clientIp)) {
      source = 'server (SSR)';
    }

    if (userAgent.includes('node') || userAgent.includes('axios')) {
      source = 'server (SSR)';
    } else if (source === 'unknown') {
      source = 'browser (legacy/assumed)';
    }

    req.requestSource = source;

    this.logger.log(`[${req.method}] ${req.url} - Source: ${source}`);

    next();
  }
}
