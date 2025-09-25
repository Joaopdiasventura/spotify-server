import { ProcessedMusicChunk } from "src/shared/interfaces/music-chunk";
import { MusicChunk } from "../entities/music-chunk.entity";
import { IMusicChunkRepository } from "./music-chunk.repository";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

export class MongoMusicChunkRepository implements IMusicChunkRepository {
  public constructor(
    @InjectModel("music-chunk")
    private readonly musicChunkModel: Model<MusicChunk>,
  ) {}

  public async createMany(musicChunks: ProcessedMusicChunk[]): Promise<void> {
    await this.musicChunkModel.insertMany(musicChunks, { ordered: true });
  }

  public findAllByMusic(music: string): Promise<MusicChunk[]> {
    return this.musicChunkModel
      .find({ music })
      .select("url duration")
      .sort({ _id: 1 })
      .exec();
  }
}
