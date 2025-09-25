import { CreateMusicDto } from "../dto/create-music.dto";
import { FindMusicDto } from "../dto/find-music.dto";
import { Music } from "../entities/music.entity";

export interface IMusicRepository {
  create(createMusicDto: CreateMusicDto): Promise<Music>;
  findById(id: string): Promise<Music | null>;
  findMany(findMusicDto: FindMusicDto): Promise<Music[]>;
}
