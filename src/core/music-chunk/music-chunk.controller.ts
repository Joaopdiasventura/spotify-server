import { Controller, Get, Param } from "@nestjs/common";
import { MusicChunkService } from "./music-chunk.service";
import { ParseObjectIdPipe } from "@nestjs/mongoose";
import { MusicChunk } from "./entities/music-chunk.entity";

@Controller("music-chunk")
export class MusicChunkController {
  public constructor(private readonly musicChunkService: MusicChunkService) {}

  @Get(":music")
  public findAllByMusic(
    @Param("music", ParseObjectIdPipe) music: string,
  ): Promise<MusicChunk[]> {
    return this.musicChunkService.findAllByMusic(music);
  }
}
