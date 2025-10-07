import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PlaylistService } from "../playlist.service";
import type { IPlaylistRepsitory } from "../repositories/playlist.repository";
import { UserService } from "../../user/user.service";
import { SongService } from "../../song/song.service";
import { CreatePlaylistDto } from "../dto/create-playlist.dto";
import { UpdatePlaylistDto } from "../dto/update-playlist.dto";
import { FindPlaylistDto } from "../dto/find-playlist.dto";
import { Playlist } from "../entities/playlist.entity";
import type { User } from "../../user/entities/user.entity";
import type { Song } from "../../song/entities/song.entity";

// Avoid importing real music-metadata via service dependency chain
jest.mock(
  "music-metadata",
  () => ({ parseBuffer: jest.fn().mockResolvedValue({ format: { duration: 0 } }) }),
  { virtual: true },
);

describe("PlaylistService", () => {
  let service: PlaylistService;
  let moduleRef: TestingModule;
  let repo: jest.Mocked<IPlaylistRepsitory>;
  let userSvc: jest.Mocked<Pick<UserService, "findById">>;
  let songSvc: jest.Mocked<Pick<SongService, "findById">>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PlaylistService,
        {
          provide: "IPlaylistRepository",
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        { provide: UserService, useValue: { findById: jest.fn() } },
        { provide: SongService, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get<PlaylistService>(PlaylistService);
    repo = moduleRef.get<IPlaylistRepsitory>(
      "IPlaylistRepository",
    ) as jest.Mocked<IPlaylistRepsitory>;
    userSvc = moduleRef.get<UserService>(UserService) as jest.Mocked<
      Pick<UserService, "findById">
    >;
    songSvc = moduleRef.get<SongService>(SongService) as jest.Mocked<
      Pick<SongService, "findById">
    >;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("create: validates user and songs then creates", async () => {
    const dto = new CreatePlaylistDto();
    dto.user = "u1";
    dto.name = "Rock";
    dto.songs = ["s1", "s2"];
    dto.isPublic = true;

    userSvc.findById.mockResolvedValueOnce({ id: "u1" } as unknown as User);
    songSvc.findById.mockResolvedValueOnce({ id: "s1" } as unknown as Song);
    songSvc.findById.mockResolvedValueOnce({ id: "s2" } as unknown as Song);

    const createMock = jest.spyOn(repo, "create");
    createMock.mockResolvedValueOnce({ id: "p1" } as unknown as Playlist);

    const res = await service.create(dto);
    const userFindMock = jest.spyOn(userSvc, "findById");
    const songFindMock = jest.spyOn(songSvc, "findById");
    expect(userFindMock).toHaveBeenCalledWith("u1");
    expect(songFindMock).toHaveBeenNthCalledWith(1, "s1");
    expect(songFindMock).toHaveBeenNthCalledWith(2, "s2");
    expect(createMock).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: "p1" });
  });

  it("findById returns playlist when found", async () => {
    const playlist = { id: "p1" } as unknown as Playlist;
    const findByIdMock = jest.spyOn(repo, "findById");
    findByIdMock.mockResolvedValueOnce(playlist);
    await expect(service.findById("p1")).resolves.toBe(playlist);
  });

  it("findById throws NotFound when missing", async () => {
    (repo.findById as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.findById("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("findMany delegates to repository", async () => {
    const list = [{ id: "p1" }] as unknown as Playlist[];
    const dto = new FindPlaylistDto();
    const findManyMock = jest.spyOn(repo, "findMany");
    findManyMock.mockResolvedValueOnce(list);
    const got = await service.findMany(dto);
    expect(findManyMock).toHaveBeenCalledWith(dto);
    expect(got).toBe(list);
  });

  it("update: validates references and returns success message", async () => {
    jest
      .spyOn(repo, "findById")
      .mockResolvedValueOnce({ id: "p1" } as unknown as Playlist);
    userSvc.findById.mockResolvedValueOnce({ id: "u2" } as unknown as User);
    songSvc.findById.mockResolvedValueOnce({ id: "s1" } as unknown as Song);
    songSvc.findById.mockResolvedValueOnce({ id: "s2" } as unknown as Song);

    const dto = new UpdatePlaylistDto();
    dto.user = "u2";
    dto.songs = ["s1", "s2"];

    const res = await service.update("p1", dto);
    const repoFindByIdMock = jest.spyOn(repo, "findById");
    const userFindMock2 = jest.spyOn(userSvc, "findById");
    const songFindMock2 = jest.spyOn(songSvc, "findById");
    expect(repoFindByIdMock).toHaveBeenCalledWith("p1");
    expect(userFindMock2).toHaveBeenCalledWith("u2");
    expect(songFindMock2).toHaveBeenNthCalledWith(1, "s1");
    expect(songFindMock2).toHaveBeenNthCalledWith(2, "s2");
    expect(res).toEqual({ message: "Playlist atualizada com sucesso" });
  });

  it("delete: validates existence and returns success message", async () => {
    jest
      .spyOn(repo, "findById")
      .mockResolvedValueOnce({ id: "p1" } as unknown as Playlist);
    const res = await service.delete("p1");
    const repoFindByIdMock2 = jest.spyOn(repo, "findById");
    expect(repoFindByIdMock2).toHaveBeenCalledWith("p1");
    expect(res).toEqual({ message: "Playlist deletada com sucesso" });
  });
});
