import { Test, TestingModule } from '@nestjs/testing';
import { SongChunkService } from '../song-chunk.service';
import type { ISongChunkRepository } from '../repositories/song-chunk.repository';
import type { ProcessedMusicChunk } from '../../../shared/interfaces/music-chunk';
import { SongChunk } from '../entities/song-chunk.entity';

describe('SongChunkService', () => {
  let service: SongChunkService;
  let moduleRef: TestingModule;
  let repo: jest.Mocked<ISongChunkRepository>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        SongChunkService,
        {
          provide: 'ISongChunkRepository',
          useValue: {
            createMany: jest.fn(),
            findAllBySong: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<SongChunkService>(SongChunkService);
    repo = moduleRef.get<ISongChunkRepository>('ISongChunkRepository') as jest.Mocked<ISongChunkRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createMany delegates to repository', async () => {
    const chunks: ProcessedMusicChunk[] = [{ url: 'u', song: 's', duration: 10 }];
    const spy = jest.spyOn(repo, 'createMany');
    await service.createMany(chunks);
    expect(spy).toHaveBeenCalledWith(chunks);
  });

  it('findAllBySong delegates to repository', async () => {
    const list = [{ id: '1' }] as unknown as SongChunk[];
    const spy = jest.spyOn(repo, 'findAllBySong').mockResolvedValueOnce(list);
    const got = await service.findAllBySong('song');
    expect(spy).toHaveBeenCalledWith('song');
    expect(got).toBe(list);
  });
});
