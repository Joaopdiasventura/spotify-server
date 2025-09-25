import { Module } from "@nestjs/common";
import { MusicChunkService } from "./music-chunk.service";
import { MusicChunkController } from "./music-chunk.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { MusicChunkSchema } from "./entities/music-chunk.entity";
import { MongoMusicChunkRepository } from "./repositories/music-chunk.mongo.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "music-chunk", schema: MusicChunkSchema },
    ]),
  ],
  controllers: [MusicChunkController],
  providers: [
    MusicChunkService,
    { provide: "IMusicChunkRepository", useClass: MongoMusicChunkRepository },
  ],
  exports: [MusicChunkService],
})
export class MusicChunkModule {}
