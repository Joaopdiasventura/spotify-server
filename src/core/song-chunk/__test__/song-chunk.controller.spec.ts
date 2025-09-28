import { Test, TestingModule } from '@nestjs/testing';
import { SongChunkController } from '../song-chunk.controller';
import { SongChunkService } from '../song-chunk.service';

describe('SongChunkController', () => {
  let controller: SongChunkController;
  let moduleRef: TestingModule;
  let service: jest.Mocked<Pick<SongChunkService, 'createMany' | 'findAllBySong'>>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [SongChunkController],
      providers: [
        {
          provide: SongChunkService,
          useValue: {
            createMany: jest.fn(),
            findAllBySong: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<SongChunkController>(SongChunkController);
    service = moduleRef.get<SongChunkService>(SongChunkService) as jest.Mocked<Pick<SongChunkService, 'createMany' | 'findAllBySong'>>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllBySong delegates to service', async () => {
    const sample: Array<{ id: string }> = [{ id: 'c1' }];
    service.findAllBySong.mockResolvedValueOnce(sample as unknown as import('../entities/song-chunk.entity').SongChunk[]);
    const res = await controller.findAllBySong('507f1f77bcf86cd799439011');
    expect(service.findAllBySong).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(res).toBe(sample);
  });
});
