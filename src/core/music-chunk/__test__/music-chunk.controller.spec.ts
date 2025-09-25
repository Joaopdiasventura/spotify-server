import { Test, TestingModule } from '@nestjs/testing';
import { MusicChunkController } from './music-chunk.controller';
import { MusicChunkService } from './music-chunk.service';

describe('MusicChunkController', () => {
  let controller: MusicChunkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MusicChunkController],
      providers: [MusicChunkService],
    }).compile();

    controller = module.get<MusicChunkController>(MusicChunkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
