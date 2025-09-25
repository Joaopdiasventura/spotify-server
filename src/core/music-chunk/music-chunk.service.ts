import { Inject, Injectable } from "@nestjs/common";
import { ProcessedMusicChunk } from "src/shared/interfaces/music-chunk";
import { MusicChunk } from "./entities/music-chunk.entity";
import type { IMusicChunkRepository } from "./repositories/music-chunk.repository";

@Injectable()
export class MusicChunkService {
  public constructor(
    @Inject("IMusicChunkRepository")
    private readonly musicChunkRepository: IMusicChunkRepository,
  ) {}

  public createMany(musicChunks: ProcessedMusicChunk[]): Promise<void> {
    return this.musicChunkRepository.createMany(musicChunks);
  }

  public findAllByMusic(music: string): Promise<MusicChunk[]> {
    return this.musicChunkRepository.findAllByMusic(music);
  }
}
