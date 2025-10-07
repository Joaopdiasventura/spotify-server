import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { SongService } from "../song.service";
import { SongChunkService } from "../../song-chunk/song-chunk.service";
import { FileService } from "../../../shared/modules/file/file.service";
import type { ISongRepository } from "../repositories/song.repository";
import { CreateSongDto } from "../dto/create-song.dto";
import { FindSongDto } from "../dto/find-song.dto";
import { Song } from "../entities/song.entity";
import type { ProcessedMusicChunk } from "../../../shared/interfaces/music-chunk";
import { UserService } from "../../user/user.service";
import type { User } from "../../user/entities/user.entity";

// Avoid importing real music-metadata via FileService dependency chain
jest.mock("music-metadata", () => ({
  parseBuffer: jest.fn().mockResolvedValue({ format: { duration: 0 } }),
}), { virtual: true });

describe("SongService", () => {
  let service: SongService;
  let moduleRef: TestingModule;
  let repo: jest.Mocked<ISongRepository>;
  let fileSvc: jest.Mocked<FileService>;
  let chunkSvc: jest.Mocked<SongChunkService>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        SongService,
        {
          provide: "ISongRepository",
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
          },
        },
        { provide: UserService, useValue: { findById: jest.fn() } },
        {
          provide: "ISongChunkRepository",
          useValue: {
            createMany: jest.fn(),
            findAllBySong: jest.fn(),
          },
        },
        {
          provide: SongChunkService,
          useValue: { createMany: jest.fn(), findAllBySong: jest.fn() },
        },
        {
          provide: FileService,
          useValue: {
            upload: jest.fn(),
            delete: jest.fn(),
            getAudioDuration: jest.fn(),
            uploadMusicInChunks: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<SongService>(SongService);
    repo = moduleRef.get<ISongRepository>("ISongRepository") as jest.Mocked<ISongRepository>;
    fileSvc = moduleRef.get<FileService>(FileService) as jest.Mocked<FileService>;
    chunkSvc = moduleRef.get<SongChunkService>(SongChunkService) as jest.Mocked<SongChunkService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("create: uploads thumbnail, reads duration, creates song and chunks", async () => {
    const dto = new CreateSongDto();
    dto.user = "u1";
    dto.title = "t";
    dto.description = "d";
    dto.artist = "a";
    dto.lyrics = "l";
    const songFile: Express.Multer.File = {
      fieldname: "song",
      originalname: "song.mp3",
      encoding: "7bit",
      mimetype: "audio/mpeg",
      buffer: Buffer.alloc(10),
      size: 10,
      destination: "",
      filename: "",
      path: "",
      stream: null as unknown as NodeJS.ReadableStream,
    };
    const thumbFile: Express.Multer.File = {
      fieldname: "thumbnail",
      originalname: "thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.alloc(1),
      size: 1,
      destination: "",
      filename: "",
      path: "",
      stream: null as unknown as NodeJS.ReadableStream,
    };

    const userSvc = moduleRef.get<UserService>(UserService) as jest.Mocked<UserService>;
    const findUserSpy = jest
      .spyOn(userSvc, "findById")
      .mockResolvedValueOnce({ id: "u1" } as unknown as User);

    const uploadSpy = jest
      .spyOn(fileSvc, 'upload')
      .mockResolvedValueOnce('thumb-url');
    const getAudioDurationSpy = jest
      .spyOn(fileSvc, 'getAudioDuration')
      .mockResolvedValueOnce(123);
    const createRepoSpy = jest
      .spyOn(repo, 'create')
      .mockResolvedValueOnce({ id: 'song-1', ...dto } as unknown as Song);
    const chunks: ProcessedMusicChunk[] = [
      { url: "u1", song: "song-1", duration: 60 },
      { url: "u2", song: "song-1", duration: 63 },
    ];
    const uploadMusicInChunksSpy = jest
      .spyOn(fileSvc, 'uploadMusicInChunks')
      .mockResolvedValueOnce(chunks);
    const createManySpy = jest.spyOn(chunkSvc, 'createMany');

    const res = await service.create(dto, songFile, thumbFile);

    expect(findUserSpy).toHaveBeenCalledWith("u1");
    expect(uploadSpy).toHaveBeenCalledWith(thumbFile);
    expect(getAudioDurationSpy).toHaveBeenCalledWith(songFile);
    expect(createRepoSpy).toHaveBeenCalledWith({
      ...dto,
      thumbnail: "thumb-url",
      duration: 123,
    });
    expect(uploadMusicInChunksSpy).toHaveBeenCalledWith("song-1", songFile);
    expect(createManySpy).toHaveBeenCalledWith(chunks);
    expect(res).toEqual({ message: "Musica adicionada com sucesso" });
  });

  it("findMany delegates to repository", async () => {
    const list = [{ id: "1" }, { id: "2" }] as unknown as Song[];
    const findManySpy = jest.spyOn(repo, 'findMany').mockResolvedValueOnce(list);
    const dto = new FindSongDto();
    const got = await service.findMany(dto);
    expect(got).toBe(list);
    expect(findManySpy).toHaveBeenCalledWith(dto);
  });

  it("findById returns song when found", async () => {
    repo.findById.mockResolvedValueOnce({ id: "x" } as unknown as Song);
    await expect(service.findById("x")).resolves.toEqual({ id: "x" } as unknown as Song);
  });

  it("findById throws NotFound when missing", async () => {
    repo.findById.mockResolvedValueOnce(null);
    await expect(service.findById("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
