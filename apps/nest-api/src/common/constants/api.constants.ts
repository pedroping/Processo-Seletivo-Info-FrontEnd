import type { CookieOptions } from 'express';

export const ALLOWED_ORIGINS: string[] = [
  'http://localhost:4200',
  'http://localhost:4100',
  'http://127.0.0.1:4100',
  'https://vehicle-register-system-1.onrender.com',
];

export const TOKEN_COOKIE = 'TokenCookie';

export const TOKEN_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  httpOnly: true,
  maxAge: 2592000,
  sameSite: 'none',
  secure: true,
};

export const CRYPTO_ALGORITHM = 'aes-256-cbc';

export const DEFAULT_COOKIE_SECRET = 'my-super-secret-key-that-is-32-chars-long';

export const DEFAULT_PORT = 3000;
