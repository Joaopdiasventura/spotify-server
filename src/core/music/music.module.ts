import { Module } from "@nestjs/common";
import { MusicService } from "./music.service";
import { MusicController } from "./music.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { MusicSchema } from "./entities/music.entity";
import { FileModule } from "src/shared/modules/file/file.module";
import { MongoMusicRepository } from "./repositories/music.mongo.repository";
import { MusicChunkModule } from "../music-chunk/music-chunk.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Music", schema: MusicSchema }]),
    MusicChunkModule,
    FileModule,
  ],
  controllers: [MusicController],
  providers: [
    MusicService,
    { provide: "IMusicRepository", useClass: MongoMusicRepository },
  ],
})
export class MusicModule {}
