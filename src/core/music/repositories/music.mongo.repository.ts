import { InjectModel } from "@nestjs/mongoose";
import { CreateMusicDto } from "../dto/create-music.dto";
import { FindMusicDto } from "../dto/find-music.dto";
import { Music } from "../entities/music.entity";
import { IMusicRepository } from "./music.repository";
import { FilterQuery, Model, PipelineStage } from "mongoose";

export class MongoMusicRepository implements IMusicRepository {
  public constructor(
    @InjectModel("Music") private readonly musicModel: Model<Music>,
  ) {}

  public create(createMusicDto: CreateMusicDto): Promise<Music> {
    return this.musicModel.insertOne(createMusicDto);
  }

  public findById(id: string): Promise<Music | null> {
    return this.musicModel.findById(id);
  }

  public findMany(findMusicDto: FindMusicDto): Promise<Music[]> {
    const pipeline: PipelineStage[] = [];

    const match: FilterQuery<Music> = {};
    if (findMusicDto.title)
      match.title = { $regex: findMusicDto.title, $options: "i" };
    if (findMusicDto.description)
      match.description = { $regex: findMusicDto.description, $options: "i" };
    if (findMusicDto.artist)
      match.artist = { $regex: findMusicDto.artist, $options: "i" };

    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    if (findMusicDto.orderBy) {
      const [field, direction] = findMusicDto.orderBy.split(":");
      if (field && direction)
        pipeline.push({
          $sort: {
            [field]: direction == "desc" ? -1 : 1,
            _id: 1,
          },
        });
    } else pipeline.push({ $sort: { createdAt: -1, title: 1, _id: 1 } });

    if (findMusicDto.limit && findMusicDto.limit > 0) {
      if (findMusicDto.page && findMusicDto.page >= 0)
        pipeline.push({ $skip: findMusicDto.page * findMusicDto.limit });
      pipeline.push({ $limit: findMusicDto.limit });
    }

    return this.musicModel.aggregate<Music>(pipeline).exec();
  }
}
