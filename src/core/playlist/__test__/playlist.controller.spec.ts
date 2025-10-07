import { Test, TestingModule } from "@nestjs/testing";
import { PlaylistController } from "../playlist.controller";
import { PlaylistService } from "../playlist.service";
import type { CreatePlaylistDto } from "../dto/create-playlist.dto";
import type { UpdatePlaylistDto } from "../dto/update-playlist.dto";
import type { FindPlaylistDto } from "../dto/find-playlist.dto";
import type { Playlist } from "../entities/playlist.entity";

// Avoid importing real music-metadata via service dependency chain
jest.mock(
  "music-metadata",
  () => ({ parseBuffer: jest.fn().mockResolvedValue({ format: { duration: 0 } }) }),
  { virtual: true },
);

describe("PlaylistController", () => {
  let controller: PlaylistController;
  let moduleRef: TestingModule;
  let service: jest.Mocked<
    Pick<
      PlaylistService,
      "create" | "findById" | "findMany" | "update" | "delete"
    >
  >;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [PlaylistController],
      providers: [
        {
          provide: PlaylistService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<PlaylistController>(PlaylistController);
    service = moduleRef.get<PlaylistService>(
      PlaylistService,
    ) as jest.Mocked<
      Pick<
        PlaylistService,
        "create" | "findById" | "findMany" | "update" | "delete"
      >
    >;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("create delegates to service", async () => {
    const dto: CreatePlaylistDto = {
      user: "u1",
      name: "Rock",
      songs: ["s1", "s2"],
      isPublic: true,
    };
    service.create.mockResolvedValueOnce({ message: "p1" });
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: "p1" });
  });

  it("findById delegates to service", async () => {
    service.findById.mockResolvedValueOnce({ id: "p1" } as unknown as Playlist);
    const res = await controller.findById("p1");
    expect(service.findById).toHaveBeenCalledWith("p1");
    expect(res).toEqual({ id: "p1" });
  });

  it("findMany delegates to service", async () => {
    const query: FindPlaylistDto = { name: "Chill" };
    const list = [{ id: "p1" }];
    service.findMany.mockResolvedValueOnce(list as unknown as Playlist[]);
    const res = await controller.findMany(query);
    expect(service.findMany).toHaveBeenCalledWith(query);
    expect(res).toBe(list as unknown as Playlist[]);
  });

  it("update delegates to service", async () => {
    const resMsg = { message: "Playlist atualizada com sucesso" };
    service.update.mockResolvedValueOnce(resMsg);
    const body: UpdatePlaylistDto = { name: "Novo" } as UpdatePlaylistDto;
    const res = await controller.update("p1", body);
    expect(service.update).toHaveBeenCalledWith("p1", body);
    expect(res).toBe(resMsg);
  });

  it("delete delegates to service", async () => {
    const resMsg = { message: "Playlist deletada com sucesso" };
    service.delete.mockResolvedValueOnce(resMsg);
    const res = await controller.delete("p1");
    expect(service.delete).toHaveBeenCalledWith("p1");
    expect(res).toBe(resMsg);
  });
});
