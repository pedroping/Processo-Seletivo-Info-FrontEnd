/**
 * Preflight para `npm run start:with-nest-api`.
 *
 * Se a porta 3000 já estiver ocupada, o `nest-api` sobe, falha com EADDRINUSE e o executor
 * `@nx/js:node` engole o erro (watch mode apenas imprime "waiting for changes to restart"):
 * o front-end continua funcionando, mas contra a API que já estava na porta — normalmente a
 * Express. Ou seja, o desenvolvedor acha que está testando a NestJS e não está.
 *
 * Uso: node tools/check-dev-ports.mjs 3000 4200
 */
import { createConnection } from 'node:net';

const HOSTS = ['127.0.0.1', '::1'];
const CONNECT_TIMEOUT = 500;

const REASONS = {
  3000: 'a API (Express ou NestJS) usa esta porta — pare o `npm start` ou o `nx serve api` antes.',
  4200:
    'o front-end usa esta porta. Em outra porta o navegador seria bloqueado por CORS, ' +
    'porque a API só libera as origens http://localhost:4200 e http://localhost:4100.',
};

/** Resolve `true` se alguém aceitar conexão na porta (cobre IPv4 e IPv6 separadamente). */
const isPortTaken = (port, host) =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host });
    const finish = (taken) => {
      socket.destroy();
      resolve(taken);
    };

    socket.setTimeout(CONNECT_TIMEOUT);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

const ports = process.argv.slice(2).map(Number).filter(Number.isInteger);
const taken = [];

for (const port of ports) {
  const perHost = await Promise.all(HOSTS.map((host) => isPortTaken(port, host)));

  if (perHost.includes(true)) {
    taken.push(port);
  }
}

if (taken.length > 0) {
  console.error('');

  for (const port of taken) {
    console.error(
      `  Porta ${port} já está em uso: ${REASONS[port] ?? 'libere-a antes de continuar.'}`,
    );
  }

  console.error('');
  console.error('  Quem está usando:  netstat -ano | findstr :<porta>');
  console.error('  Como encerrar:     taskkill /F /T /PID <pid>');
  console.error('');

  process.exit(1);
}
