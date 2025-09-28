import { ProcessedMusicChunk } from "src/shared/interfaces/music-chunk";
import { SongChunk } from "../entities/song-chunk.entity";

export interface ISongChunkRepository {
  createMany(musicChunks: ProcessedMusicChunk[]): Promise<void>;
  findAllBySong(song: string): Promise<SongChunk[]>;
}
