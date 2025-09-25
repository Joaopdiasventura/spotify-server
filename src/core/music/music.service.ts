import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateMusicDto } from "./dto/create-music.dto";
import { Message } from "../../shared/interfaces/messages";
import { FileService } from "../../shared/modules/file/file.service";
import type { IMusicRepository } from "./repositories/music.repository";
import { MusicChunkService } from "../music-chunk/music-chunk.service";
import { Music } from "./entities/music.entity";
import { FindMusicDto } from "./dto/find-music.dto";

@Injectable()
export class MusicService {
  public constructor(
    @Inject("IMusicRepository")
    private readonly musicRepository: IMusicRepository,
    private readonly musicChunkService: MusicChunkService,
    private readonly fileService: FileService,
  ) {}

  public async create(
    createMusicDto: CreateMusicDto,
    musicFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File,
  ): Promise<Message> {
    createMusicDto.thumbnail = await this.fileService.upload(thumbnailFile);
    createMusicDto.duration =
      await this.fileService.getAudioDuration(musicFile);
    const music = await this.musicRepository.create(createMusicDto);
    const chunks = await this.fileService.uploadMusicInChunks(
      music.id,
      musicFile,
    );
    await this.musicChunkService.createMany(chunks);
    return { message: "Musica adicionada com sucesso" };
  }

  public findMany(findMusicDto: FindMusicDto): Promise<Music[]> {
    return this.musicRepository.findMany(findMusicDto);
  }

  public async findById(id: string): Promise<Music> {
    const music = await this.musicRepository.findById(id);
    if (!music) throw new NotFoundException("Música não encontrada");
    return music;
  }
}
