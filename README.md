<h1 align="center">Spotify Server (NestJS) – Documentação Oficial</h1>

API em Node.js/NestJS para gerenciamento de músicas: upload com thumbnail, extração de duração, divisão do áudio em chunks e persistência em MongoDB. Suporte a armazenamento local e AWS S3.

## Sumário

- Visão Geral
- Arquitetura e Módulos
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
- `FileModule`: serviço de arquivos com providers Local (desenvolvimento) e AWS S3 (produção).
- `ConfigModule`: carrega `AppConfig` e `DatabaseConfig`.
- `MongooseModule`: conexão com MongoDB.

Estrutura principal de pastas:
- `src/core/song` – Música (DTOs, entidade, controller, service, repositórios)
- `src/core/song-chunk` – Chunks de música (entidade, controller, service, repositórios)
- `src/shared/modules/file` – Upload/remoção de arquivos (Local/AWS)
- `src/config` – Configurações de app e banco

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

## Configuração (variáveis de ambiente)

As configurações são lidas em `src/config/app.config.ts` e `src/config/db.config.ts`.

- Aplicação
  - `APP_URL` (default: `http://localhost:3000`)
  - `NODE_ENV` (default: `development`)
  - `PORT` (default: `3000`)
  - `CHUNK_SIZE_SECONDS` (default: `10`)
  - `CLIENT_URL` (default: `http://localhost:4200`)

- Banco/AWS
  - `MONGO_URI` (default: `mongodb://localhost:27017/spotify`)
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

Exemplo `.env`:

```
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
CHUNK_SIZE_SECONDS=10
CLIENT_URL=http://localhost:4200

MONGO_URI=mongodb://localhost:27017/spotify

# Somente para produção (NODE_ENV=production)
AWS_REGION=us-east-1
AWS_S3_BUCKET=meu-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Endpoints da API

Base: `http://localhost:3000`

- POST `/song`
  - Upload multipart/form-data
  - Fields:
    - Body: `title`, `description`, `artist`, `lyrics` (CreateSongDto)
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

- GET `/song-chunk/:song`
  - `:song` é o ObjectId da música
  - Resposta ordenada por `_id` ascendente: `Array<{ url: string; duration: number; song: string }>`

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

## Armazenamento de Arquivos (Local/S3)

O `FileService` escolhe o provider com base em `NODE_ENV`:
- `development` (ou outro valor): `LocalService` grava em `uploads/` e retorna URLs baseadas em `APP_URL`.
- `production`: `AwsService` usa S3 com região/bucket/credenciais.

Observações:
- Em ambiente local, sirva `uploads/` estaticamente no seu gateway/web server para que os URLs sejam acessíveis externamente.
- O tamanho dos chunks é controlado por `CHUNK_SIZE_SECONDS`.

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

