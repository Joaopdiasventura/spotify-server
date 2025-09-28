import { InjectModel } from "@nestjs/mongoose";
import { CreateSongDto } from "../dto/create-song.dto";
import { FindSongDto } from "../dto/find-song.dto";
import { Song } from "../entities/song.entity";
import { ISongRepository } from "./song.repository";
import { FilterQuery, Model, PipelineStage } from "mongoose";

export class MongoSongRepository implements ISongRepository {
  public constructor(
    @InjectModel("Song") private readonly musicModel: Model<Song>,
  ) {}

  public create(createSongDto: CreateSongDto): Promise<Song> {
    return this.musicModel.insertOne(createSongDto);
  }

  public findById(id: string): Promise<Song | null> {
    return this.musicModel.findById(id);
  }

  public findMany(findSongDto: FindSongDto): Promise<Song[]> {
    const pipeline: PipelineStage[] = [];

    const match: FilterQuery<Song> = {};
    if (findSongDto.title)
      match.title = { $regex: findSongDto.title, $options: "i" };
    if (findSongDto.description)
      match.description = { $regex: findSongDto.description, $options: "i" };
    if (findSongDto.artist)
      match.artist = { $regex: findSongDto.artist, $options: "i" };

    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    if (findSongDto.orderBy) {
      const [field, direction] = findSongDto.orderBy.split(":");
      if (field && direction)
        pipeline.push({
          $sort: {
            [field]: direction == "desc" ? -1 : 1,
            _id: 1,
          },
        });
    } else pipeline.push({ $sort: { createdAt: -1, title: 1, _id: 1 } });

    if (findSongDto.limit && findSongDto.limit > 0) {
      if (findSongDto.page && findSongDto.page >= 0)
        pipeline.push({ $skip: findSongDto.page * findSongDto.limit });
      pipeline.push({ $limit: findSongDto.limit });
    }

    return this.musicModel.aggregate<Song>(pipeline).exec();
  }
}
