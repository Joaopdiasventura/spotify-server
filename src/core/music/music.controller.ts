import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  Query,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { MusicService } from "./music.service";
import { CreateMusicDto } from "./dto/create-music.dto";
import { FindMusicDto } from "./dto/find-music.dto";
import { Message } from "../../shared/interfaces/messages";
import { Music } from "./entities/music.entity";

@Controller("music")
export class MusicController {
  public constructor(private readonly musicService: MusicService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "music", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
  )
  public create(
    @Body() createMusicDto: CreateMusicDto,
    @UploadedFiles()
    files: {
      music: Express.Multer.File[];
      thumbnail: Express.Multer.File[];
    },
  ): Promise<Message> {
    return this.musicService.create(
      createMusicDto,
      files.music[0],
      files.thumbnail[0],
    );
  }

  @Get()
  public findMany(@Query() findMusicDto: FindMusicDto): Promise<Music[]> {
    return this.musicService.findMany(findMusicDto);
  }

  @Get(":id")
  public findById(@Param("id") id: string): Promise<Music> {
    return this.musicService.findById(id);
  }
}
