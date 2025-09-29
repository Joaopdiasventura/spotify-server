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
    song: string,
    file: Express.Multer.File,
  ): Promise<ProcessedMusicChunk[]> {
    try {
      if (!file || !file.buffer)
        throw new BadRequestException("Arquivo inválido");

      const chunkSizeSeconds =
        this.configService.get<number>("chunkSizeSeconds") ?? 10;

      const metadata = await parseBuffer(file.buffer, {
        mimeType: file.mimetype,
        size: file.size,
      });

      const totalDuration = metadata.format.duration ?? 0;
      const totalBytes = file.buffer.length;

      if (!totalDuration || totalDuration <= 0) {
        const url = await this.storage.upload(file);
        return [{ url, song, duration: 0 }];
      }

      const bytesPerSecond = totalBytes / totalDuration;
      const chunkSizeBytes = Math.max(
        1,
        Math.floor(bytesPerSecond * chunkSizeSeconds),
      );
      const numChunks = Math.ceil(totalBytes / chunkSizeBytes);

      const uploadPromises: Promise<{
        index: number;
        url: string;
        duration: number;
      }>[] = [];

      for (let idx = 0; idx < numChunks; idx++) {
        const start = idx * chunkSizeBytes;
        const end = Math.min(start + chunkSizeBytes, totalBytes);
        const segmentView = file.buffer.subarray(start, end);
        const segment = Buffer.from(segmentView);
        const fakeFile: Express.Multer.File = {
          ...file,
          buffer: segment,
          size: segment.length,
          originalname: `${song}-${String(idx).padStart(5, "0")}.mp3`,
        };
        const duration = Math.min(
          chunkSizeSeconds,
          Math.max(0, totalDuration - start / bytesPerSecond),
        );
        const p = (async (): Promise<{
          index: number;
          url: string;
          duration: number;
        }> => {
          const url = await this.storage.upload(fakeFile);
          return { index: idx, url, duration };
        })();
        uploadPromises.push(p);
      }

      const results = await Promise.all(uploadPromises);
      results.sort((a, b) => a.index - b.index);

      return results.map((r) => ({ url: r.url, song, duration: r.duration }));
    } catch (error) {
      Logger.error(error, "FileService.uploadMusicInChunks");
      throw new InternalServerErrorException(
        "Erro ao processar chunks do áudio",
      );
    }
  }
}
