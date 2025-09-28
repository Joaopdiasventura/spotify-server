import { ProcessedMusicChunk } from "src/shared/interfaces/music-chunk";
import { SongChunk } from "../entities/song-chunk.entity";
import { ISongChunkRepository } from "./song-chunk.repository";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

export class MongoSongChunkRepository implements ISongChunkRepository {
  public constructor(
    @InjectModel("song-chunk")
    private readonly musicChunkModel: Model<SongChunk>,
  ) {}

  public async createMany(musicChunks: ProcessedMusicChunk[]): Promise<void> {
    await this.musicChunkModel.insertMany(musicChunks, { ordered: true });
  }

  public findAllBySong(song: string): Promise<SongChunk[]> {
    return this.musicChunkModel
      .find({ song })
      .select("url duration")
      .sort({ _id: 1 })
      .exec();
  }
}
