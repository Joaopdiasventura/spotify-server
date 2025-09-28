import { Inject, Injectable } from "@nestjs/common";
import { ProcessedMusicChunk } from "src/shared/interfaces/music-chunk";
import { SongChunk } from "./entities/song-chunk.entity";
import type { ISongChunkRepository } from "./repositories/song-chunk.repository";

@Injectable()
export class SongChunkService {
  public constructor(
    @Inject("ISongChunkRepository")
    private readonly songChunkRepository: ISongChunkRepository,
  ) {}

  public createMany(musicChunks: ProcessedMusicChunk[]): Promise<void> {
    return this.songChunkRepository.createMany(musicChunks);
  }

  public findAllBySong(song: string): Promise<SongChunk[]> {
    return this.songChunkRepository.findAllBySong(song);
  }
}
