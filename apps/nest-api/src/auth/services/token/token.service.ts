import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { CRYPTO_ALGORITHM, DEFAULT_COOKIE_SECRET } from '../../../common/constants/api.constants';
import type { ClientIp } from '../../../common/models/custom-request.model';

export interface TokenPayload {
  ip?: ClientIp;
  pass?: string;
  createdAt?: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  encrypt(payload: object): string {
    const text = JSON.stringify(payload);
    const iv = randomBytes(16);
    const cipher = createCipheriv(CRYPTO_ALGORITHM, this.getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(token: string): TokenPayload | null {
    try {
      const [ivHex, encryptedData] = token.split(':');

      if (!ivHex || !encryptedData) {
        return null;
      }

      const iv = Buffer.from(ivHex, 'hex');
      const decipher = createDecipheriv(CRYPTO_ALGORITHM, this.getKey(), iv);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted) as TokenPayload;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      return null;
    }
  }

  private getKey(): Buffer {
    const secret = process.env['COOKIE_SECRET'] || DEFAULT_COOKIE_SECRET;

    return createHash('sha256').update(secret).digest();
  }
}
