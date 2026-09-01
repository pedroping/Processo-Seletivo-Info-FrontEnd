import { Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { CRYPTO_ALGORITHM, DEFAULT_COOKIE_SECRET } from '../../../common/constants/api.constants';
import { TokenPayload, TokenService } from './token.service';

const expressGetKey = (): Buffer =>
  createHash('sha256')
    .update(process.env['COOKIE_SECRET'] || DEFAULT_COOKIE_SECRET)
    .digest();

const expressEncryptToken = (payload: object): string => {
  const text = JSON.stringify(payload);
  const iv = randomBytes(16);
  const cipher = createCipheriv(CRYPTO_ALGORITHM, expressGetKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

const expressDecryptToken = (token: string): TokenPayload | null => {
  try {
    const [ivHex, encryptedData] = token.split(':');
    if (!ivHex || !encryptedData) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(CRYPTO_ALGORITHM, expressGetKey(), iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as TokenPayload;
  } catch {
    return null;
  }
};

describe('TokenService', () => {
  const originalSecret = process.env['COOKIE_SECRET'];
  let service: TokenService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    service = new TokenService();
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalSecret === undefined) {
      delete process.env['COOKIE_SECRET'];
    } else {
      process.env['COOKIE_SECRET'] = originalSecret;
    }
  });

  it('round-trips a payload through encrypt -> decrypt', () => {
    const payload: TokenPayload = { ip: '127.0.0.1', pass: 'Test123', createdAt: 1700000000000 };

    expect(service.decrypt(service.encrypt(payload))).toEqual(payload);
  });

  it('produces a different token for the same payload (random IV)', () => {
    const payload: TokenPayload = { ip: '127.0.0.1', pass: 'Test123', createdAt: 1 };

    const first = service.encrypt(payload);
    const second = service.encrypt(payload);

    expect(first).not.toBe(second);
    expect(service.decrypt(first)).toEqual(service.decrypt(second));
  });

  it('emits tokens in the `<ivHex>:<payloadHex>` format', () => {
    const [ivHex, encrypted] = service.encrypt({ pass: 'Test123' }).split(':');

    expect(ivHex).toMatch(/^[0-9a-f]{32}$/);
    expect(encrypted).toMatch(/^[0-9a-f]+$/);
  });

  it('returns null for malformed input without throwing', () => {
    expect(() => service.decrypt('garbage')).not.toThrow();
    expect(service.decrypt('garbage')).toBeNull();

    expect(() => service.decrypt('nope:nope')).not.toThrow();
    expect(service.decrypt('nope:nope')).toBeNull();

    expect(service.decrypt('')).toBeNull();
    expect(service.decrypt(':')).toBeNull();
  });

  it('logs the failure via the Nest Logger when decryption throws', () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    expect(service.decrypt('nope:nope')).toBeNull();
    expect(error).toHaveBeenCalledWith('Decryption failed:', expect.anything());
  });

  it('decrypts a token minted with the same COOKIE_SECRET', () => {
    process.env['COOKIE_SECRET'] = 'another-super-secret-key-32-chars!!';

    const token = service.encrypt({ pass: 'Test123' });

    expect(service.decrypt(token)).toEqual({ pass: 'Test123' });
  });

  it('cannot decrypt a token minted with a different COOKIE_SECRET', () => {
    process.env['COOKIE_SECRET'] = 'secret-number-one-that-is-32-chars!';
    const token = service.encrypt({ pass: 'Test123' });

    process.env['COOKIE_SECRET'] = 'secret-number-two-that-is-32-chars!';

    expect(service.decrypt(token)).toBeNull();
  });

  describe('cross-compatibility with the Express API', () => {
    const payload: TokenPayload = { ip: '::1', pass: 'Test123', createdAt: 1700000000000 };

    it('produces tokens the Express `decryptToken` can read', () => {
      expect(expressDecryptToken(service.encrypt(payload))).toEqual(payload);
    });

    it('reads tokens produced by the Express `encryptToken`', () => {
      expect(service.decrypt(expressEncryptToken(payload))).toEqual(payload);
    });

    it('stays compatible when COOKIE_SECRET is customised', () => {
      process.env['COOKIE_SECRET'] = 'shared-secret-between-both-apis!!!';

      expect(expressDecryptToken(service.encrypt(payload))).toEqual(payload);
      expect(service.decrypt(expressEncryptToken(payload))).toEqual(payload);
    });

    it('derives the key exactly like the Express API (sha256 of the secret)', () => {
      delete process.env['COOKIE_SECRET'];

      const iv = randomBytes(16);
      const key = createHash('sha256').update(DEFAULT_COOKIE_SECRET).digest();
      const cipher = createCipheriv(CRYPTO_ALGORITHM, key, iv);

      let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      expect(service.decrypt(`${iv.toString('hex')}:${encrypted}`)).toEqual(payload);
    });
  });
});
