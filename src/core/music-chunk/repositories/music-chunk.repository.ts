import { ProcessedMusicChunk } from "src/shared/interfaces/music-chunk";
import { MusicChunk } from "../entities/music-chunk.entity";

export interface IMusicChunkRepository {
  createMany(musicChunks: ProcessedMusicChunk[]): Promise<void>;
  findAllByMusic(music: string): Promise<MusicChunk[]>;
}
