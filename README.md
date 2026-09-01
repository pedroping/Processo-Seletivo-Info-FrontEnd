<div align="center">
  <h1>Sistema de Cadastro de Veículos</h1>
  <p><em>Aplicação Angular 20 com SSR, autenticação por cookie criptografado e API em Express ou NestJS, organizada em um monorepo Nx.</em></p>
</div>

<p align="center">
 <a href="#eye_speech_bubble-imagens">Imagens</a> •
 <a href="#hammer_and_wrench-tecnologias">Tecnologias</a> •
 <a href="#package-estrutura-do-monorepo">Estrutura</a> •
 <a href="#rocket-como-rodar">Como rodar</a> •
 <a href="#electric_plug-api">API</a> •
 <a href="#lock-autenticação-e-ssr">Autenticação e SSR</a> •
 <a href="#test_tube-testes-lint-e-documentação">Testes</a> •
 <a href="#brain-conceitos-aplicados">Conceitos</a>
</p>

## :eye_speech_bubble: **Imagens**

<div align="center">
   <img alt="Listagem de veículos" src="/public/all-vehicles.png" />
   <img alt="Edição de veículo" src="/public/edit-vehicle.png" />
   <img alt="Novo veículo" src="/public/new-vehicle.png" />
   <img alt="Diálogo de confirmação" src="/public/confirm-dialog.png" />
   <img alt="Estado sem dados" src="/public/no-data.png" />
</div>

## :hammer_and_wrench: **Tecnologias**

<div align="center">

|                 :globe_with_meridians: Todas as Tecnologias                  |
| :--------------------------------------------------------------------------: |
|                   [HTML](https://www.w3schools.com/html/)                    |
|                        [SCSS](https://sass-lang.com/)                        |
|                [TypeScript](https://www.typescriptlang.org/)                 |
|                      [Angular 20](https://angular.dev/)                      |
|                 [Angular SSR](https://angular.dev/guide/ssr)                 |
|   [Angular Service Worker](https://angular.dev/ecosystem/service-workers)    |
|                            [Nx](https://nx.dev/)                             |
|                   [Express](https://expressjs.com/pt-br/)                    |
|                        [NestJS](https://nestjs.com/)                         |
|                          [RxJS](https://rxjs.dev/)                           |
|              [Toastr](https://www.npmjs.com/package/ngx-toastr)              |
|                   [FontAwesome](https://fontawesome.com/)                    |
|          [Karma](https://karma-runner.github.io/latest/index.html)           |
|                    [Jasmine](https://jasmine.github.io/)                     |
|                       [Jest](https://jestjs.io/pt-BR/)                       |
|                        [ESLint](https://eslint.org/)                         |
|                       [Prettier](https://prettier.io/)                       |
|                      [Compodoc](https://compodoc.app/)                       |
| [JavaScript Obfuscator](https://www.npmjs.com/package/javascript-obfuscator) |

</div>

## :package: **Estrutura do monorepo**

O projeto é um monorepo [Nx](https://nx.dev/) com três aplicações dentro de `apps/`:

| Projeto                   | O que é                                                                                                               | Porta                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `vehicle-register-system` | Front-end Angular 20 com SSR, standalone components, service worker e hydration incremental.                          | `4200` (dev) / `4000` (SSR) |
| `api`                     | Back-end **padrão**: servidor Express escrito à mão (`apps/api/src/main.ts`) com CRUD genérico sobre um arquivo JSON. | `3000`                      |
| `nest-api`                | Back-end **alternativo**: o mesmo contrato HTTP reescrito em NestJS, modularizado. Drop-in do projeto `api`.          | `3000`                      |

### Front-end (`apps/vehicle-register-system/src/app/`)

- **`core/`** — singletons da aplicação:
  - `services/api/*` — apenas chamadas HTTP (`auth`, `brands`, `categories`, `vehicles`);
  - `services/facades/*` — estado + orquestração em cima dos serviços de API (é o que os componentes injetam);
  - `services/utils/*` — `CustomRouteReuseStrategy`, `DialogHandle`, `HasChanges`, `LoadingHandle`, `TransferState`, `TransitionState`;
  - `interceptors/` — tratamento de erro, loading e repasse de cookies durante o SSR;
  - `guards/` — `authGuard` e `canDeactivateGuard`;
  - `providers/`, `ui/` (header, footer, dialog, loading-spinner).
- **`domain/`** — áreas de funcionalidade (`home`, `login`, `vehicle`), cada uma com suas rotas lazy (`*-routes.ts`) e pastas de páginas/componentes.
- **`shared/`** — `models`, `enums`, `tokens`, `directives`, `components`, `animations`, `utils`.

### Aliases de import (`tsconfig.base.json`)

Use os aliases em vez de caminhos relativos: `@utils`, `@tokens`, `@models`, `@enums`, `@directives`, `@components`, `@animations`, `@interceptors`, `@guards`, `@providers`, `@services`, `@ui`, `@environment`. Cada alias aponta para um barrel `index.ts` — ao criar algo novo, exporte-o no barrel correspondente.

### Rotas

O roteamento é totalmente lazy: as rotas raiz carregam as rotas de domínio, que por sua vez usam `loadComponent`.

| Rota          | Página                                  |
| ------------- | --------------------------------------- |
| `/`           | Listagem de veículos (dentro da `home`) |
| `/novo`       | Cadastro de um novo veículo             |
| `/editar/:id` | Edição de um veículo existente          |
| `/login`      | Tela de login                           |

As rotas protegidas usam `authGuard`; formulários usam `canDeactivateGuard` para avisar sobre alterações não salvas. O `data.reuse`/`data.keys` das rotas alimenta a `CustomRouteReuseStrategy`, registrada como `RouteReuseStrategy` em `app.config.ts`.

## :rocket: **Como rodar**

Instale as dependências uma vez:

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm start
```

O target `serve` do Angular tem `dependsOn: ["api:serve"]`, ou seja, **este comando sobe também a API Express**. Depois, acesse http://localhost:4200/ — a API responde em http://localhost:3000/.

### Ambiente de desenvolvimento com a API NestJS

```bash
npm run start:with-nest-api
```

Sobe em paralelo o `nest-api` (porta 3000) e o front-end (porta 4200) — é o equivalente de `npm start`, mas com a API NestJS no lugar da Express.

A flag `--excludeTaskDependencies` no script é **obrigatória**: ela suprime o `dependsOn: ["api:serve"]` do target `serve` do Angular. Sem ela o Nx subiria a API Express junto e as duas brigariam pela porta 3000. Não tente conferir isso com `--graph=stdout` — o comando de grafo do Nx ignora essa flag e mostra o `api:serve` mesmo assim; confira na saída da execução real.

Antes de subir, o script roda `tools/check-dev-ports.mjs` para garantir que as portas 3000 e 4200 estão livres. Isso não é decoração: se a 3000 já estiver ocupada, o `nest-api` falha com `EADDRINUSE`, o executor `@nx/js:node` engole o erro (watch mode) e você acaba usando a **API que já estava na porta** sem perceber.

Detalhes que valem saber:

- Os dois processos sobem em paralelo, sem espera — se a primeira requisição falhar, recarregue a página.
- Cada API tem seu próprio `db.json` dentro de `dist/`. Dados criados em uma não aparecem na outra, e cada novo build restaura o estado inicial de `apps/nest-api/src/assets/db.json`.
- Se o terminal for fechado à força (em vez de `Ctrl+C`), o processo Node do `nest-api` pode continuar segurando as portas 3000 e 9229. Use `netstat -ano | findstr :3000` e `taskkill /F /T /PID <pid>`.

### Subir apenas um projeto

```bash
npx nx serve vehicle-register-system --excludeTaskDependencies   # só o front-end (sem a flag, o Nx sobe a API Express junto)
npx nx serve api                                                 # só a API Express
npm run start:nest-api                                           # só a API NestJS
```

> As duas APIs escutam na porta `3000` e atendem exatamente o mesmo contrato, então rode **uma por vez**: `npm start` usa a Express, `npm run start:with-nest-api` usa a NestJS.

### Build de produção

```bash
npm run build
```

Esse comando faz o build de produção do Angular, aplica obfuscação de JavaScript no bundle do browser (`dist/vehicle-register-system/browser`) e builda os dois back-ends (`api` e `nest-api`), em `dist/apps/api` e `dist/apps/nest-api`.

### Rodar em modo produção com SSR

```bash
npm run serve:ssr
```

Faz o build e sobe, em paralelo, o servidor SSR do Angular (http://localhost:4000/) e a API Express (http://localhost:3000/).

O `serve:ssr` sobe a API Express. Como o `npm run build` já builda os dois back-ends, para rodar a NestJS a partir do `dist/` basta usar o script equivalente ao `serve:express-server`:

```bash
npm run serve:nest-server   # node ./dist/apps/nest-api/main.js
```

Ou seja, o `serve:ssr` com a NestJS é `npm run build` + `serve:app-server` + `serve:nest-server` (não há script único para essa combinação). Os dois rodam na porta 3000, então use um por vez.

### Variáveis de ambiente

- `environment.API` **não** vem de um arquivo `.env`: é definido em tempo de build pelo símbolo global `API_URL`, via opção `define` em `apps/vehicle-register-system/project.json` — `"http://localhost:3000"` em desenvolvimento e `"/api"` em produção (nesse caso o servidor SSR faz o proxy).
- As duas APIs (Express e NestJS) leem `PORT`, `COOKIE_SECRET` e `VERY_SECRET` via `dotenv`.
- O servidor SSR lê `CLIENT_PORT`, `API_URL` e `COOKIE_SECRET`.

## :electric_plug: **API**

O contrato HTTP é implementado duas vezes, e as duas implementações são intercambiáveis:

- **Express** (`apps/api/src/main.ts`) — um factory `createCrudRouter` gera as rotas CRUD de cada entidade; persiste em `apps/api/src/assets/db.json`.
- **NestJS** (`apps/nest-api/`) — o mesmo comportamento modularizado; persiste em `apps/nest-api/src/assets/db.json`.

Nenhuma das duas usa prefixo global: as rotas ficam na raiz, porque é assim que o front-end as consome (`environment.API` + `/vehicles`, e o servidor SSR reescreve `/api` → `/`).

| Método   | Rota                                    | Descrição                                  |
| -------- | --------------------------------------- | ------------------------------------------ |
| `GET`    | `/vehicles` · `/brands` · `/categories` | Lista todos os registros da entidade       |
| `GET`    | `/vehicles/:id`                         | Busca um registro pelo id                  |
| `POST`   | `/vehicles`                             | Cria um registro (gera o `id` se não vier) |
| `PUT`    | `/vehicles/:id`                         | Atualiza parcialmente um registro          |
| `DELETE` | `/vehicles/:id`                         | Remove um registro                         |
| `POST`   | `/login`                                | Cria o cookie `TokenCookie` criptografado  |
| `GET`    | `/session`                              | Valida o cookie de sessão e o IP de origem |

As mesmas rotas existem para `brands` e `categories`. Todas as requisições exigem o cookie `TokenCookie` — exceto `/login` e `/secret/:id` — caso contrário recebem `401 {"message":"Unauthorized: TokenCookie is required"}`. O CORS está liberado apenas para as origens conhecidas do projeto, com `credentials: true`.

### Estrutura da API NestJS (`apps/nest-api/src/`)

| Pasta                                 | Papel                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `common/`                             | Constantes, models, o decorator `@Public()`, o `TokenCookieGuard` global e o `RequestSourceMiddleware`                          |
| `database/`                           | `DatabaseService` — leitura/escrita do `db.json`, com as mutações serializadas para não perder gravações concorrentes           |
| `crud/`                               | `CrudService` + `BaseCrudController` — equivalente ao factory `createCrudRouter` do Express, via herança dos decorators de rota |
| `vehicles/`, `brands/`, `categories/` | Um módulo/controller por entidade, cada um só declarando qual chave do `db.json` usa                                            |
| `auth/`                               | `TokenService` (AES-256-CBC), `AuthService` e o `AuthController` com `/login`, `/session` e `/secret/:id`                       |

Equivalências entre as duas implementações:

| Express                              | NestJS                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| `validateAuthCookie` (middleware)    | `TokenCookieGuard` global + `@Public()` em `/login` e `/secret/:id` |
| `validateRequestSource` (middleware) | `RequestSourceMiddleware`                                           |
| `createCrudRouter(entity)` (factory) | `CrudService` + `BaseCrudController` herdado                        |
| `readDb` / `writeDb`                 | `DatabaseService.read()` / `.write()` / `.runExclusive()`           |
| `encryptToken` / `decryptToken`      | `TokenService.encrypt()` / `.decrypt()`                             |

Os erros usam `HttpException` com corpo de objeto (e não `NotFoundException`/`UnauthorizedException`) porque as exceções nativas do Nest acrescentariam os campos `error` e `statusCode` — a API Express responde apenas `{"message":"..."}`. Os tokens são compatíveis entre os dois back-ends e com o servidor SSR: mesmo `aes-256-cbc`, mesma chave derivada por sha256 e mesmo formato `iv:payload` em hexadecimal.

> A menção a `json-server` em versões anteriores deste README está desatualizada: o CRUD hoje é servido pelos projetos `api` (Express) e `nest-api` (NestJS).

## :lock: **Autenticação e SSR**

- **Servidor SSR** (`apps/vehicle-register-system/server.ts`, porta `4000`): define cabeçalhos de segurança e CSP, faz proxy de `/api/*` para a API Express (reescrevendo o path e repassando cookies) e serve os assets estáticos.
- **Cookies**: o login gera um `TokenCookie` criptografado (AES-256-CBC, `httpOnly`) na API. O servidor SSR também emite um `CurrentSessionCookie` criptografado quando ele não existe.
- **Fallback para CSR**: requisições sem `TokenCookie` (e fora da rota de login) recebem `index.csr.html` em vez de serem renderizadas no servidor. A renderização SSR tem timeout de 30s, que também cai para CSR.
- **Cookies no SSR**: o `serverCookieInterceptor` repassa os cookies da requisição Express para as chamadas do `HttpClient` feitas durante a renderização no servidor (usando o token `REQUEST` de `@tokens`).
- **Transferência de estado**: o `TransferStateService` move valores de `process.env` do servidor para o `TransferState` do Angular, permitindo a hidratação do cliente sem refazer requisições.
- O `authGuard` retorna `of(true)` no servidor e, no navegador, valida a sessão via `AuthFacadeService.checkSession()`, redirecionando para `/login` quando inválida — ou seja, a proteção de rota é feita no cliente.

## :test_tube: **Testes, lint e documentação**

```bash
npm test                                # roda todos os testes do monorepo (nx test)
npx nx test vehicle-register-system     # testes do front-end (Karma/Jasmine)
npx nx test api                         # testes da API Express (Jest)
npx nx test nest-api                    # testes da API NestJS (Jest)
npm run lint                            # ESLint (flat config em eslint.config.mjs)
npm run lint:fix                        # ESLint com correção automática
npm run format                          # Prettier em todo o repositório
npm run compodoc:build-and-serve        # gera e serve a documentação Compodoc
```

A configuração do Karma fica em `apps/vehicle-register-system/karma.conf.js`. O TypeScript roda em modo estrito, com `noPropertyAccessFromIndexSignature` — por isso variáveis de ambiente são acessadas como `process.env['CHAVE']`.

## :brain: _Conceitos Aplicados_

<div align="center">

|           🧠 Conceitos           |
| :------------------------------: |
|       Conventional Commits       |
|         Monorepo com Nx          |
|      Standalone Components       |
|   Server-Side Rendering (SSR)    |
|      Hydration Incremental       |
|      Separação API / Facade      |
|          Facade Pattern          |
|        Observable Pattern        |
|            ReactiveX             |
|       Dependency Injection       |
|         Injection Tokens         |
|      Lazy Loading de Rotas       |
| Route Reuse Strategy customizada |
|      Guards e Interceptors       |
|          Transfer State          |
|       View Transitions API       |
|       PWA / Service Worker       |
| Cookies HTTP-only criptografados |
|  Cabeçalhos de segurança e CSP   |

</div>

## :bookmark_tabs: **Convenções**

- **Conventional Commits** (`Feat:`, `Fix:`, `Refactor:`, ...), branch padrão `master`.
- Apenas standalone components; novos componentes usam SCSS e o prefixo `info`.
- Imports sempre pelos aliases de path, com exportação nos barrels `index.ts`.
