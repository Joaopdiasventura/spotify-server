import { Module } from "@nestjs/common";
import { SongModule } from "./song/song.module";
import { SongChunkModule } from "./song-chunk/song-chunk.module";

@Module({
  imports: [SongModule, SongChunkModule],
})
export class CoreModule {}
