import { Test, TestingModule } from '@nestjs/testing';
import { MusicChunkService } from './music-chunk.service';

describe('MusicChunkService', () => {
  let service: MusicChunkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MusicChunkService],
    }).compile();

    service = module.get<MusicChunkService>(MusicChunkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
