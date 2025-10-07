<h1 align="center">Spotify Server (NestJS) – Documentação Oficial</h1>

API em Node.js/NestJS para gerenciamento de músicas: upload com thumbnail, extração de duração, divisão do áudio em chunks e persistência em MongoDB. Suporte a armazenamento local e AWS S3.

## Sumário

- Visão Geral
- Arquitetura e Módulos
- Padrões de Projeto
- Fluxos Principais
- Instalação e Execução
- Configuração (variáveis de ambiente)
- Endpoints da API
- Entidades e DTOs
- Armazenamento de Arquivos (Local/S3)
- Testes e Qualidade de Código
- Docker

## Visão Geral

Este serviço expõe rotas para:
- Criar uma música com upload de arquivo e thumbnail.
- Listar músicas com filtros, paginação e ordenação.
- Buscar música por ID.
- Listar chunks (segmentos) de uma música processada.

Ao criar uma música, o servidor:
1. Faz upload da thumbnail para o provedor de arquivos.
2. Lê a duração do áudio (via `music-metadata`).
3. Persiste a música no banco (MongoDB).
4. Divide o arquivo de áudio em chunks de `CHUNK_SIZE_SECONDS` segundos.
5. Faz upload de cada chunk e persiste seus metadados (URL e duração) em `song-chunk`.

## Arquitetura e Módulos

- `CoreModule`
  - `SongModule`: controller, service e repositório (`MongoSongRepository`).
  - `SongChunkModule`: controller, service e repositório (`MongoSongChunkRepository`).
  - `UserModule`: controller, service e repositório (`MongoUserRepository`).
  - `PlaylistModule`: controller, service e repositório (`MongoPlaylistRepository`).
- `FileModule`: serviço de arquivos com providers Local (desenvolvimento) e AWS S3 (produção).
- `ConfigModule`: carrega `AppConfig` e `DatabaseConfig`.
- `MongooseModule`: conexão com MongoDB.

Estrutura principal de pastas:
- `src/core/song` – Música (DTOs, entidade, controller, service, repositórios)
- `src/core/song-chunk` – Chunks de música (entidade, controller, service, repositórios)
- `src/core/user` – Usuários e autenticação (DTOs, entidade, controller, service, repositórios)
- `src/core/playlist` – Playlists (DTOs, entidade, controller, service, repositórios)
- `src/shared/modules/file` – Upload/remoção de arquivos (Local/AWS)
- `src/config` – Configurações de app e banco

## Padrões de Projeto

- Repository
  - Abstração de persistência por interfaces e implementações específicas de MongoDB. Exemplos:
    - `src/core/song/repositories/song.repository.ts`
    - `src/core/song/repositories/song.mongo.repository.ts`
    - `src/core/user/repositories/user.repository.ts`
    - `src/core/user/repositories/user.mongo.repository.ts`
    - `src/core/playlist/repositories/playlist.repository.ts`
    - `src/core/playlist/repositories/playlist.mongo.repository.ts`
  - Bind por token no módulo (IoC): `useClass` mapeia interface → implementação (ex.: `src/core/song/song.module.ts`).
- Strategy (Storage de arquivos)
  - Contrato `FileStorageProvider` com duas estratégias: Local e AWS S3.
  - Seleção em runtime no `FileService` conforme `NODE_ENV` (dev = Local, prod = S3).
  - Arquivos relevantes:
    - `src/shared/modules/file/providers/index.ts`
    - `src/shared/modules/file/providers/local/local.service.ts`
    - `src/shared/modules/file/providers/aws/aws.service.ts`
    - `src/shared/modules/file/file.service.ts`
- Dependency Injection / IoC (NestJS)
  - Injeção por tokens em serviços (ex.: `@Inject("ISongRepository")`). Providers registrados em módulos (`useClass`).
- Camadas (Controller → Service → Repository)
  - Controllers tratam HTTP; Services encapsulam regras/orquestram; Repositories persistem.
- DTO/Validação
  - DTOs com `class-validator` + `ValidationPipe` global (transform/whitelist) para entradas seguras.
- Factory de Configuração
  - `useFactory` para Mongoose e JWT, lendo segredos/URIs via `ConfigService`.

## Fluxos Principais

- Criar Música (POST `/song`)
  - `SongController` recebe DTO e arquivos (`FileFieldsInterceptor`) e delega ao service (`src/core/song/song.controller.ts`).
  - `SongService`:
    - Faz upload do thumbnail e calcula duração (`FileService`).
    - Persiste a música via `ISongRepository` e obtém o `id`.
    - Divide o áudio em chunks e faz upload em paralelo; persiste metadados via `SongChunkService`.
- Login (POST `/user/login`)
  - `UserController` delega para `UserService` (`src/core/user/user.controller.ts`).
  - `UserService` busca usuário por e‑mail, compara senha (`AuthService`/bcrypt) e gera JWT (`JwtService`). Remove `password` do retorno.
- Reset de Senha (PATCH `/user/resetPassword/:email`)
  - Gera senha temporária, faz hash e atualiza; envia e‑mail via `EmailService` (SMTP/Gmail).

## Instalação e Execução

- Pré-requisitos: Node.js 18+, npm, e um MongoDB acessível.

Instalar dependências:

```
npm install
```

Executar em desenvolvimento:

```
npm run start:dev
```

Executar em produção (compilado):

```
npm run build
npm run start:prod
```

Notas de execução:
- CORS permite origem configurada em `CLIENT_URL` (`src/main.ts`).
- Em ambiente não‑produção, a pasta `uploads/` é servida estaticamente em `/uploads`.

## Configuração (variáveis de ambiente)

As configurações são lidas em `src/config/app.config.ts` e `src/config/db.config.ts`.

- Aplicação
  - `APP_URL` (default: `http://localhost:3000`)
  - `NODE_ENV` (default: `development`)
  - `PORT` (default: `3000`)
  - `SALTS` (rounds do bcrypt; default: `5`)
  - `CHUNK_SIZE_SECONDS` (default: `10`)
  - `CLIENT_URL` (default: `http://localhost:4200`)
  - `JWT_SECRET` (default: `spotify`)
  - `RANDOM_PASSWORD_SIZE` (tamanho da senha temporária; obrigatório para reset)

- Banco/AWS
  - `MONGO_URI` (default: `mongodb://localhost:27017/spotify`)
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

- E-mail (SMTP)
  - `EMAIL_ADDRESS` (conta remetente)
  - `EMAIL_PASSWORD` (senha/app password)

Exemplo `.env`:

```
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
SALTS=10
CHUNK_SIZE_SECONDS=10
CLIENT_URL=http://localhost:4200
JWT_SECRET=supersecret
RANDOM_PASSWORD_SIZE=12

MONGO_URI=mongodb://localhost:27017/spotify

# Somente para produção (NODE_ENV=production)
AWS_REGION=us-east-1
AWS_S3_BUCKET=meu-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# SMTP (necessário para reset de senha)
EMAIL_ADDRESS=meu.email@gmail.com
EMAIL_PASSWORD=senha_ou_app_password
```

## Endpoints da API

Base: `http://localhost:3000`

### Song

- POST `/song`
  - Upload multipart/form-data
  - Body (CreateSongDto): `title`, `description`, `artist`, `lyrics`
  - Files: `song` (áudio), `thumbnail` (imagem)
  - Resposta: `{ "message": "Musica adicionada com sucesso" }`

Exemplo cURL:

```
curl -X POST http://localhost:3000/song \
  -F "title=Minha Música" \
  -F "description=Descrição" \
  -F "artist=Artista" \
  -F "lyrics=Letras..." \
  -F "song=@/caminho/arquivo.mp3;type=audio/mpeg" \
  -F "thumbnail=@/caminho/thumb.jpg;type=image/jpeg"
```

- GET `/song`
  - Query (FindSongDto): `title`, `description`, `artist`, `orderBy` (ex: `createdAt:desc`), `limit`, `page`
  - Resposta: `Song[]`

- GET `/song/:id`
  - Resposta: `Song`

### SongChunk

- GET `/song-chunk/:song`
  - `:song` é o ObjectId da música
  - Resposta: lista de chunks ordenada por `_id` asc.

### User / Auth

- POST `/user`
  - Body: `name`, `email`, `password`
  - Cria usuário, hasheia senha (bcrypt) e retorna token JWT.

- POST `/user/login`
  - Body: `email`, `password`
  - Autentica e retorna `{ message, token, user }`.

- GET `/user/decodeToken/:token`
  - Decodifica JWT e retorna o usuário (sem `password`).

- PATCH `/user/:id`
  - Body: campos parciais do usuário; se alterar `password`, re‑hasheia.

- PATCH `/user/resetPassword/:email`
  - Gera nova senha aleatória e envia via e‑mail.

- DELETE `/user/:id`
  - Remove usuário.

### Playlist

- POST `/playlist`
  - Body: `user` (id), `name`, `songs` (ids)
  - Valida existência de `user` e cada `song` antes de criar.

- GET `/playlist/:id`
  - Retorna playlist com `songs` populados (sem `description`/`lyrics`) e `user` com `name`.

- GET `/playlist`
  - Query (FindPlaylistDto): `name`, `user`, `orderBy`, `limit`, `page`.

- PATCH `/playlist/:id`
  - Atualiza dados após validar referências.

- DELETE `/playlist/:id`
  - Remove playlist.

## Entidades e DTOs

- Song (`src/core/song/entities/song.entity.ts`)
  - `title`, `description`, `artist`, `lyrics`, `thumbnail`, `duration`
  - Timestamps habilitados (Mongoose)

- SongChunk (`src/core/song-chunk/entities/song-chunk.entity.ts`)
  - `url`, `duration`, `song` (ref: `Song`)

- CreateSongDto (`src/core/song/dto/create-song.dto.ts`)
  - `title`, `description`, `artist`, `lyrics` (validação via class-validator)

- FindSongDto (`src/core/song/dto/find-song.dto.ts`)
  - Filtros opcionais + `orderBy`, `limit`, `page`

- User (`src/core/user/entities/user.entity.ts`)
  - Campos do usuário; senha armazenada com hash (bcrypt).

- DTOs de User
  - `CreateUserDto`, `LoginUserDto`, `UpdateUserDto`.

## Armazenamento de Arquivos (Local/S3)

O `FileService` escolhe o provider com base em `NODE_ENV`:
- `development` (ou outro valor): `LocalService` grava em `uploads/` e retorna URLs baseadas em `APP_URL`.
- `production`: `AwsService` usa S3 com região/bucket/credenciais.

Observações:
- Em ambiente local, sirva `uploads/` estaticamente no seu gateway/web server para que os URLs sejam acessíveis externamente.
- O tamanho dos chunks é controlado por `CHUNK_SIZE_SECONDS`.

## Autenticação e Segurança

- Hash de senhas com `bcrypt` e `SALTS` (`src/shared/modules/auth/auth.service.ts`).
- JWT assinado com `JWT_SECRET` via `JwtModule.registerAsync`.
- Em respostas, o campo `password` é removido de objetos de usuário antes do retorno.

## Testes e Qualidade de Código

- Unit tests:

```
npm test
```

- Lint:

```
npm run lint
```

- Cobertura:

```
npm run test:cov
```

## Docker

Subir com Docker Compose (inclui MongoDB):

```
docker compose up --build
```

O serviço ficará disponível em `http://localhost:3000` e o MongoDB em `mongodb://localhost:27017`.

Para mais detalhes, veja `README.Docker.md`.

## Licença

UNLICENSED
