interface IAppConfig {
  url: string;
  env: string;
  port: number;
  chunkSizeSeconds: number;
  client: {
    url: string;
  };
}

export const AppConfig = (): IAppConfig => ({
  url: process.env.APP_URL ?? "http://localhost:3000",
  env: process.env.NODE_ENV ?? "development",
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  chunkSizeSeconds: process.env.CHUNK_SIZE_SECONDS
    ? parseInt(process.env.CHUNK_SIZE_SECONDS)
    : 10,
  client: { url: process.env.CLIENT_URL ?? "http://localhost:4200" },
});
