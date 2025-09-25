import { Module } from "@nestjs/common";
import { MusicModule } from "./music/music.module";
import { MusicChunkModule } from "./music-chunk/music-chunk.module";

@Module({
  imports: [MusicModule, MusicChunkModule],
})
export class CoreModule {}
