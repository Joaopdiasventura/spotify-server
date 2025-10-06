import { Module } from "@nestjs/common";
import { SongModule } from "./song/song.module";
import { SongChunkModule } from "./song-chunk/song-chunk.module";
import { UserModule } from './user/user.module';
import { PlaylistModule } from './playlist/playlist.module';

@Module({
  imports: [SongModule, SongChunkModule, UserModule, PlaylistModule],
})
export class CoreModule {}
