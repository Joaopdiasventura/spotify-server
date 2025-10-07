import { Test, TestingModule } from "@nestjs/testing";
import { SongController } from "../song.controller";
import { SongService } from "../song.service";

// Avoid importing real music-metadata via service dependency chain
jest.mock("music-metadata", () => ({
  parseBuffer: jest.fn().mockResolvedValue({ format: { duration: 0 } }),
}), { virtual: true });

describe("SongController", () => {
  let controller: SongController;
  let moduleRef: TestingModule;
  let service: jest.Mocked<SongService>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [SongController],
      providers: [
        {
          provide: SongService,
          useValue: {
            create: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<SongController>(SongController);
    service = moduleRef.get<SongService>(SongService) as jest.Mocked<SongService>;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("create forwards DTO and files to service", async () => {
    const dto = { user: "u1", title: "t", description: "d", artist: "a", lyrics: "l" };
    const song: Express.Multer.File = {
      fieldname: "song",
      originalname: "s.mp3",
      encoding: "7bit",
      mimetype: "audio/mpeg",
      buffer: Buffer.alloc(10),
      size: 10,
      destination: "",
      filename: "",
      path: "",
      stream: null as unknown as NodeJS.ReadableStream,
    };
    const thumbnail: Express.Multer.File = {
      ...song,
      fieldname: "thumbnail",
      originalname: "t.jpg",
    };
    const files: { song: Express.Multer.File[]; thumbnail: Express.Multer.File[] } = {
      song: [song],
      thumbnail: [thumbnail],
    };

    const createSpy = jest
      .spyOn(service, 'create')
      .mockResolvedValueOnce({ message: 'Musica adicionada com sucesso' });

    const res = await controller.create(dto, files);
    expect(createSpy).toHaveBeenCalledWith(dto, song, thumbnail);
    expect(res).toEqual({ message: "Musica adicionada com sucesso" });
  });

  it("findMany delegates to service", async () => {
    const dto: Record<string, unknown> = { q: "beatles" };
    const list = [{ id: "1" }];
    const findManySpy = jest
      .spyOn(service, 'findMany')
      .mockResolvedValueOnce(list as unknown as import('../entities/song.entity').Song[]);
    const res = await controller.findMany(dto);
    expect(findManySpy).toHaveBeenCalledWith(dto);
    expect(res).toBe(list);
  });

  it("findById delegates to service", async () => {
    const findByIdSpy = jest
      .spyOn(service, 'findById')
      .mockResolvedValueOnce({ id: 'x' } as unknown as import('../entities/song.entity').Song);
    const res = await controller.findById("x");
    expect(findByIdSpy).toHaveBeenCalledWith("x");
    expect(res).toEqual({ id: "x" });
  });
});
