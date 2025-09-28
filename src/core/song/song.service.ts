import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateSongDto } from "./dto/create-song.dto";
import { Message } from "../../shared/interfaces/messages";
import { FileService } from "../../shared/modules/file/file.service";
import type { ISongRepository } from "./repositories/song.repository";
import { SongChunkService } from "../song-chunk/song-chunk.service";
import { Song } from "./entities/song.entity";
import { FindSongDto } from "./dto/find-song.dto";

@Injectable()
export class SongService {
  public constructor(
    @Inject("ISongRepository")
    private readonly songRepository: ISongRepository,
    private readonly songChunkService: SongChunkService,
    private readonly fileService: FileService,
  ) {}

  public async create(
    createSongDto: CreateSongDto,
    songFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File,
  ): Promise<Message> {
    createSongDto.thumbnail = await this.fileService.upload(thumbnailFile);
    createSongDto.duration =
      await this.fileService.getAudioDuration(songFile);
    const song = await this.songRepository.create(createSongDto);
    const chunks = await this.fileService.uploadMusicInChunks(
      song.id,
      songFile,
    );
    await this.songChunkService.createMany(chunks);
    return { message: "Musica adicionada com sucesso" };
  }

  public findMany(findSongDto: FindSongDto): Promise<Song[]> {
    return this.songRepository.findMany(findSongDto);
  }

  public async findById(id: string): Promise<Song> {
    const song = await this.songRepository.findById(id);
    if (!song) throw new NotFoundException("Música não encontrada");
    return song;
  }
}
