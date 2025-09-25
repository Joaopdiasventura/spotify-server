import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { parseBuffer } from "music-metadata";
import { ProcessedMusicChunk } from "../../interfaces/music-chunk";
import type { FileStorageProvider } from "./providers";

@Injectable()
export class FileService {
  private storage: FileStorageProvider;

  public constructor(
    private readonly configService: ConfigService,
    @Inject("DevelopmentStorage")
    private readonly developmentStorage: FileStorageProvider,
    @Inject("ProductionStorage")
    private readonly productionStorage: FileStorageProvider,
  ) {
    this.storage =
      this.configService.get<string>("env") == "production"
        ? this.productionStorage
        : this.developmentStorage;
  }

  public async upload(file: Express.Multer.File): Promise<string> {
    return this.storage.upload(file);
  }

  public async delete(url: string): Promise<void> {
    return this.storage.delete(url);
  }

  public async getAudioDuration(file: Express.Multer.File): Promise<number> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException("Arquivo inválido");
      }

      const metadata = await parseBuffer(file.buffer, {
        mimeType: file.mimetype,
        size: file.size,
      });

      return Math.floor(metadata.format.duration ?? 0);
    } catch (error) {
      Logger.error(error, "FileService.getAudioDuration");
      throw new InternalServerErrorException(
        "Erro ao receber a duração do arquivo",
      );
    }
  }

  public async uploadMusicInChunks(
    music: string,
    file: Express.Multer.File,
  ): Promise<ProcessedMusicChunk[]> {
    try {
      if (!file || !file.buffer)
        throw new BadRequestException("Arquivo inválido");

      const chunkSizeSeconds =
        this.configService.get<number>("chunkSizeSeconds")!;

      const metadata = await parseBuffer(file.buffer, {
        mimeType: file.mimetype,
        size: file.size,
      });

      const totalDuration = metadata.format.duration ?? 0;
      const totalBytes = file.buffer.length;
      const bytesPerSecond = totalBytes / totalDuration;

      const chunkSizeBytes = bytesPerSecond * chunkSizeSeconds;

      const chunks: ProcessedMusicChunk[] = [];

      for (let i = 0; i < totalBytes; i += chunkSizeBytes) {
        const chunk = file.buffer.subarray(i, i + chunkSizeBytes);

        const fakeFile: Express.Multer.File = {
          ...file,
          buffer: chunk,
          size: chunk.length,
          originalname: `${Date.now()}-${i}.mp3`,
        };

        const url = await this.storage.upload(fakeFile);

        chunks.push({
          url,
          music,
          duration: Math.min(
            chunkSizeSeconds,
            totalDuration - i / bytesPerSecond,
          ),
        });
      }

      return chunks;
    } catch (error) {
      Logger.error(error, "FileService.uploadMusicInChunks");
      throw new InternalServerErrorException(
        "Erro ao processar chunks do áudio",
      );
    }
  }
}
