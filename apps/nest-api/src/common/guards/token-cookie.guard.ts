import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { TOKEN_COOKIE } from '../constants/api.constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TokenCookieGuard implements CanActivate {
  private readonly logger = new Logger(TokenCookieGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.cookies?.[TOKEN_COOKIE]) {
      this.logger.warn(`[Blocked] Access attempt to ${request.originalUrl} without TokenCookie`);

      throw new HttpException(
        { message: 'Unauthorized: TokenCookie is required' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
