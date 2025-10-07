import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import type { IUserRepository } from "../repositories/user.repository";
import { AuthService } from "../../../shared/modules/auth/auth.service";
import { EmailService } from "../../../shared/modules/email/email.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { User } from "../entities/user.entity";
import type { CreateUserDto } from "../dto/create-user.dto";
import type { LoginUserDto } from "../dto/login-user.dto";
import type { UpdateUserDto } from "../dto/update-user.dto";

describe("UserService", () => {
  let service: UserService;
  let repo: jest.Mocked<IUserRepository>;
  let auth: jest.Mocked<AuthService>;
  let email: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: "IUserRepository",
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          } as jest.Mocked<IUserRepository>,
        },
        {
          provide: AuthService,
          useValue: {
            generateToken: jest.fn(),
            decodeToken: jest.fn(),
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
            generateRandomPassword: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendMail: jest.fn(),
            createNewPasswordMessage: jest.fn().mockReturnValue("<html>")
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get("IUserRepository");
    auth = module.get(AuthService);
    email = module.get(EmailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("create: hashes password, creates and returns token+user", async () => {
    repo.findByEmail = jest.fn().mockResolvedValueOnce(null);
    auth.hashPassword = jest.fn().mockResolvedValueOnce("hashed");
    repo.create = jest.fn().mockResolvedValueOnce({
      id: "u1",
      toObject: () => ({ id: "u1", name: "n", email: "e", password: "hashed" }),
    } as unknown as User);
    auth.generateToken = jest.fn().mockResolvedValueOnce("tok");

    const dto: CreateUserDto = { name: "n", email: "e", password: "p" } as CreateUserDto;
    const res = await service.create(dto);
    const hashMock = jest.spyOn(auth, "hashPassword");
    const createMock = jest.spyOn(repo, "create");
    expect(hashMock).toHaveBeenCalledWith("p");
    expect(createMock).toHaveBeenCalledWith({ name: "n", email: "e", password: "hashed" });
    expect(res).toEqual({ message: "Usuário criado com sucesso", token: "tok", user: { id: "u1", name: "n", email: "e" } });
  });

  it("create: throws when email already used", async () => {
    repo.findByEmail = jest.fn().mockResolvedValueOnce({ id: "u" } as unknown as User);
    const dto: CreateUserDto = { name: "n", email: "e", password: "p" } as CreateUserDto;
    await expect(
      service.create(dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("login: success path returns token+user", async () => {
    repo.findByEmail = jest
      .fn()
      .mockResolvedValueOnce({ id: "u1", password: "h", toObject: () => ({ id: "u1", name: "n", email: "e", password: "h" }) } as unknown as User);
    auth.comparePassword = jest.fn().mockResolvedValueOnce(undefined);
    auth.generateToken = jest.fn().mockResolvedValueOnce("tok");
    const dto: LoginUserDto = { email: "e", password: "p" } as LoginUserDto;
    const res = await service.login(dto);
    const compareMock = jest.spyOn(auth, "comparePassword");
    expect(compareMock).toHaveBeenCalledWith("p", "h");
    expect(res).toEqual({ message: "Login realizado com sucesso", token: "tok", user: { id: "u1", name: "n", email: "e" } });
  });

  it("login: throws when user not found", async () => {
    repo.findByEmail = jest.fn().mockResolvedValueOnce(null);
    const dto: LoginUserDto = { email: "e", password: "p" } as LoginUserDto;
    await expect(service.login(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("findById: returns user when found", async () => {
    repo.findById = jest.fn().mockResolvedValueOnce({ id: "u1" } as unknown as User);
    await expect(service.findById("u1")).resolves.toEqual({ id: "u1" } as unknown as User);
  });

  it("findById: throws when missing", async () => {
    repo.findById = jest.fn().mockResolvedValueOnce(null);
    await expect(service.findById("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("decodeToken: decodes id and returns user without password", async () => {
    auth.decodeToken = jest.fn().mockResolvedValueOnce("u1");
    repo.findById = jest.fn().mockResolvedValueOnce({
      id: "u1",
      toObject: () => ({ id: "u1", name: "n", email: "e", password: "h" }),
    } as unknown as User);
    const user = await service.decodeToken("tok");
    const decodeMock = jest.spyOn(auth, "decodeToken");
    expect(decodeMock).toHaveBeenCalledWith("tok");
    expect(user).toEqual({ id: "u1", name: "n", email: "e" });
  });

  it("update: email change validates uniqueness and password change hashes", async () => {
    repo.findById = jest.fn().mockResolvedValueOnce({ email: "old@e", password: "old-h" } as unknown as User);
    repo.findByEmail = jest.fn().mockResolvedValueOnce(null); // unique email ok
    auth.hashPassword = jest.fn().mockResolvedValueOnce("new-h");
    const dto: UpdateUserDto = { email: "new@e", password: "p" } as UpdateUserDto;
    await service.update("u1", dto);
    const repoFindByIdMock = jest.spyOn(repo, "findById");
    const repoFindByEmailMock = jest.spyOn(repo, "findByEmail");
    const hashMock2 = jest.spyOn(auth, "hashPassword");
    const updateMock = jest.spyOn(repo, "update");
    expect(repoFindByIdMock).toHaveBeenCalledWith("u1");
    expect(repoFindByEmailMock).toHaveBeenCalledWith("new@e");
    expect(hashMock2).toHaveBeenCalledWith("p");
    expect(updateMock).toHaveBeenCalledWith("u1", { email: "new@e", password: "new-h" });
  });

  it("update: no password provided does not hash", async () => {
    repo.findById = jest.fn().mockResolvedValueOnce({ email: "e", password: "h" } as unknown as User);
    const dto2: UpdateUserDto = { name: "x" } as UpdateUserDto;
    await service.update("u1", dto2);
    const hashMock3 = jest.spyOn(auth, "hashPassword");
    const updateMock2 = jest.spyOn(repo, "update");
    expect(hashMock3).not.toHaveBeenCalled();
    expect(updateMock2).toHaveBeenCalledWith("u1", { name: "x" });
  });

  it("resetPassword: generates, hashes and sends email", async () => {
    repo.findByEmail = jest.fn().mockResolvedValueOnce({ id: "u1" } as unknown as User);
    auth.generateRandomPassword = jest.fn().mockReturnValue("R@nd");
    auth.hashPassword = jest.fn().mockResolvedValueOnce("H");
    email.createNewPasswordMessage = jest.fn().mockReturnValueOnce("<html>");
    await service.resetPassword("e");
    const updateMock3 = jest.spyOn(repo, "update");
    const sendMailMock = jest.spyOn(email, "sendMail");
    expect(updateMock3).toHaveBeenCalledWith("u1", { password: "H" });
    expect(sendMailMock).toHaveBeenCalledWith({ to: "e", subject: "NOVA SENHA EPV", html: "<html>" });
  });

  it("delete: removes after existence check", async () => {
    repo.findById = jest.fn().mockResolvedValueOnce({ id: "u1" } as unknown as User);
    await service.delete("u1");
    const deleteMock = jest.spyOn(repo, "delete");
    expect(deleteMock).toHaveBeenCalledWith("u1");
  });
});
