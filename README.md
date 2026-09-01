<div align="center">
  <h1>Sistema de Cadastro de Veículos</h1>
  <p><em>Aplicação Angular 20 com SSR, autenticação por cookie criptografado e API Express, organizada em um monorepo Nx.</em></p>
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

| Projeto                   | O que é                                                                                                              | Porta                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `vehicle-register-system` | Front-end Angular 20 com SSR, standalone components, service worker e hydration incremental.                         | `4200` (dev) / `4000` (SSR) |
| `api`                     | Back-end **ativo**: servidor Express escrito à mão (`apps/api/src/main.ts`) com CRUD genérico sobre um arquivo JSON. | `3000`                      |
| `nest-api`                | Scaffold mínimo em NestJS — não é o back-end principal, serve como base para uma futura migração.                    | —                           |

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

Para subir apenas um projeto individualmente:

```bash
npx nx serve vehicle-register-system   # somente o front-end
npx nx serve api                       # somente a API Express
npm run start:nest-api                 # scaffold NestJS (opcional)
```

### Build de produção

```bash
npm run build
```

Esse comando faz o build de produção do Angular, aplica obfuscação de JavaScript no bundle do browser (`dist/vehicle-register-system/browser`) e builda o projeto `api`.

### Rodar em modo produção com SSR

```bash
npm run serve:ssr
```

Faz o build e sobe, em paralelo, o servidor SSR do Angular (http://localhost:4000/) e a API Express (http://localhost:3000/).

### Variáveis de ambiente

- `environment.API` **não** vem de um arquivo `.env`: é definido em tempo de build pelo símbolo global `API_URL`, via opção `define` em `apps/vehicle-register-system/project.json` — `"http://localhost:3000"` em desenvolvimento e `"/api"` em produção (nesse caso o servidor SSR faz o proxy).
- A API Express lê `PORT`, `COOKIE_SECRET` e `VERY_SECRET` via `dotenv`.
- O servidor SSR lê `CLIENT_PORT`, `API_URL` e `COOKIE_SECRET`.

## :electric_plug: **API**

A API é um servidor Express (`apps/api/src/main.ts`) que persiste os dados em `apps/api/src/assets/db.json`. Um factory `createCrudRouter` gera as rotas CRUD para cada entidade.

| Método   | Rota                                    | Descrição                                  |
| -------- | --------------------------------------- | ------------------------------------------ |
| `GET`    | `/vehicles` · `/brands` · `/categories` | Lista todos os registros da entidade       |
| `GET`    | `/vehicles/:id`                         | Busca um registro pelo id                  |
| `POST`   | `/vehicles`                             | Cria um registro (gera o `id` se não vier) |
| `PUT`    | `/vehicles/:id`                         | Atualiza parcialmente um registro          |
| `DELETE` | `/vehicles/:id`                         | Remove um registro                         |
| `POST`   | `/login`                                | Cria o cookie `TokenCookie` criptografado  |
| `GET`    | `/session`                              | Valida o cookie de sessão e o IP de origem |

As mesmas rotas existem para `brands` e `categories`. Todas as requisições (exceto `/login`) exigem o cookie `TokenCookie`, caso contrário recebem `401`. O CORS está liberado apenas para as origens conhecidas do projeto, com `credentials: true`.

> A menção a `json-server` em versões anteriores deste README está desatualizada: o CRUD hoje é servido pelo projeto Express `api`.

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
npx nx test api                         # testes da API (Jest)
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
