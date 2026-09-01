import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ClientIp } from 'apps/nest-api/src/common/models/custom-request.model';
import { TokenService } from '../token/token.service';

@Injectable()
export class AuthService {
  constructor(private readonly tokenService: TokenService) {}

  createToken(clientIp: ClientIp, password: unknown): string {
    if (!password) {
      throw new HttpException({ message: 'Password required' }, HttpStatus.BAD_REQUEST);
    }

    return this.tokenService.encrypt({
      ip: clientIp,
      pass: password,
      createdAt: Date.now(),
    });
  }

  validateSession(cookieValue: string | undefined, currentIp: ClientIp): { message: string } {
    if (!cookieValue) {
      throw new HttpException({ message: 'No cookie found' }, HttpStatus.UNAUTHORIZED);
    }

    const data = this.tokenService.decrypt(cookieValue);

    if (!data) {
      throw new HttpException({ message: 'Invalid Token' }, HttpStatus.UNAUTHORIZED);
    }

    if (data.ip?.[0] === currentIp?.[0]) {
      return { message: 'Valid!' };
    }

    if (data.ip !== currentIp && !this.tokenIpContainsCurrentIp(data.ip, currentIp)) {
      throw new HttpException(
        { message: 'IP Address mismatch! Token stolen?' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return { message: 'Valid!' };
  }

  revealSecret(id: string): { message: string } {
    if (id === process.env['VERY_SECRET']) {
      return { message: 'Toop' };
    }

    throw new HttpException({ message: 'Not found' }, HttpStatus.NOT_FOUND);
  }

  private tokenIpContainsCurrentIp(tokenIp: ClientIp, currentIp: ClientIp): boolean {
    if (tokenIp === undefined) {
      return false;
    }

    const needle: ClientIp =
      typeof currentIp === 'string' ? currentIp.slice(0, 14) : currentIp?.slice(0, 14);

    if (needle === undefined) {
      return false;
    }

    if (typeof tokenIp === 'string') {
      return tokenIp.includes(typeof needle === 'string' ? needle : needle.join(','));
    }

    return typeof needle === 'string' && tokenIp.includes(needle);
  }
}
