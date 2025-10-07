import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "../user.controller";
import { UserService } from "../user.service";
import { AuthMessage } from "../../../shared/interfaces/messages/auth";
import { Message } from "../../../shared/interfaces/messages";
import type { CreateUserDto } from "../dto/create-user.dto";
import type { LoginUserDto } from "../dto/login-user.dto";
import type { UpdateUserDto } from "../dto/update-user.dto";

describe("UserController", () => {
  let controller: UserController;
  let service: jest.Mocked<Pick<
    UserService,
    "create" | "login" | "decodeToken" | "update" | "resetPassword" | "delete"
  >>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            login: jest.fn(),
            decodeToken: jest.fn(),
            update: jest.fn(),
            resetPassword: jest.fn(),
            delete: jest.fn(),
          } as unknown as Record<keyof UserService, jest.Mock>,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService) as jest.Mocked<Pick<
      UserService,
      "create" | "login" | "decodeToken" | "update" | "resetPassword" | "delete"
    >>;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("create delegates to service", async () => {
    const spy = jest
      .spyOn(service, "create")
      .mockResolvedValueOnce({ message: "ok", token: "t", user: {} } as AuthMessage);
    const dto: CreateUserDto = { name: "n", email: "e", password: "p" } as CreateUserDto;
    const res = await controller.create(dto);
    expect(spy).toHaveBeenCalled();
    expect(res.message).toBe("ok");
  });

  it("login delegates to service", async () => {
    const spy = jest
      .spyOn(service, "login")
      .mockResolvedValueOnce({ message: "ok", token: "t", user: {} } as AuthMessage);
    const dto: LoginUserDto = { email: "e", password: "p" } as LoginUserDto;
    const res = await controller.login(dto);
    expect(spy).toHaveBeenCalled();
    expect(res.token).toBe("t");
  });

  it("decodeToken delegates to service", async () => {
    const spy = jest
      .spyOn(service, "decodeToken")
      .mockResolvedValueOnce({ id: "u1" } as unknown as import("../entities/user.entity").User);
    const res = await controller.decodeToken("tok");
    expect(spy).toHaveBeenCalledWith("tok");
    expect(res).toEqual({ id: "u1" });
  });

  it("update delegates to service", async () => {
    const spy = jest
      .spyOn(service, "update")
      .mockResolvedValueOnce({ message: "ok" } as Message);
    const dto: UpdateUserDto = { name: "x" } as UpdateUserDto;
    const res = await controller.update("id", dto);
    expect(spy).toHaveBeenCalledWith("id", dto);
    expect(res).toEqual({ message: "ok" });
  });

  it("resetPassword delegates to service", async () => {
    const spy = jest
      .spyOn(service, "resetPassword")
      .mockResolvedValueOnce({ message: "ok" } as Message);
    const res = await controller.resetPassword("e@e");
    expect(spy).toHaveBeenCalledWith("e@e");
    expect(res).toEqual({ message: "ok" });
  });

  it("delete delegates to service", async () => {
    const spy = jest
      .spyOn(service, "delete")
      .mockResolvedValueOnce({ message: "ok" } as Message);
    const res = await controller.delete("id");
    expect(spy).toHaveBeenCalledWith("id");
    expect(res).toEqual({ message: "ok" });
  });
});
