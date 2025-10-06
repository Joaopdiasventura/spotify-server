import { InjectModel } from "@nestjs/mongoose";
import { CreatePlaylistDto } from "../dto/create-playlist.dto";
import { FindPlaylistDto } from "../dto/find-playlist.dto";
import { UpdatePlaylistDto } from "../dto/update-playlist.dto";
import { Playlist } from "../entities/playlist.entity";
import { IPlaylistRepsitory } from "./playlist.repository";
import { FilterQuery, Model, PipelineStage } from "mongoose";

export class MongoPlaylistDto implements IPlaylistRepsitory {
  public constructor(
    @InjectModel("Playlist") private readonly playlistModel: Model<Playlist>,
  ) {}

  public create(createPlaylistDto: CreatePlaylistDto): Promise<Playlist> {
    return this.playlistModel.insertOne(createPlaylistDto);
  }

  public findById(id: string): Promise<Playlist | null> {
    return this.playlistModel
      .findById(id)
      .populate({ path: "songs", select: "-description -lyrics" })
      .populate({ path: "user", select: "name" })
      .exec();
  }

  public findMany(findPlaylistDto: FindPlaylistDto): Promise<Playlist[]> {
    const pipeline: PipelineStage[] = [];

    const match: FilterQuery<Playlist> = {};
    if (findPlaylistDto.name)
      match.name = { $regex: findPlaylistDto.name, $options: "i" };
    if (findPlaylistDto.user)
      match.user = { $regex: findPlaylistDto.user, $options: "i" };

    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    if (findPlaylistDto.orderBy) {
      const [field, direction] = findPlaylistDto.orderBy.split(":");
      if (field && direction)
        pipeline.push({
          $sort: {
            [field]: direction == "desc" ? -1 : 1,
            _id: 1,
          },
        });
    } else pipeline.push({ $sort: { createdAt: -1, title: 1, _id: 1 } });

    if (findPlaylistDto.limit && findPlaylistDto.limit > 0) {
      if (findPlaylistDto.page && findPlaylistDto.page >= 0)
        pipeline.push({ $skip: findPlaylistDto.page * findPlaylistDto.limit });
      pipeline.push({ $limit: findPlaylistDto.limit });
    }

    return this.playlistModel.aggregate<Playlist>(pipeline).exec();
  }

  public async update(
    id: string,
    updatePlaylistDto: UpdatePlaylistDto,
  ): Promise<void> {
    await this.playlistModel.findByIdAndUpdate(id, updatePlaylistDto);
  }

  public async delete(id: string): Promise<void> {
    await this.playlistModel.findByIdAndDelete(id);
  }
}
