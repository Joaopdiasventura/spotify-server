import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue("token"),
            verifyAsync: jest.fn().mockResolvedValue({ sub: "user-id" }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case "salts":
                  return 5;
                case "randomPasswordSize":
                  return 12;
                case "jwt.secret":
                  return "secret";
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwt = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("generateToken returns signed token", async () => {
    const signSpy = jest.spyOn(jwt, "signAsync");
    const token = await service.generateToken("abc");
    expect(signSpy).toHaveBeenCalledWith("abc");
    expect(token).toBe("token");
  });

  it("decodeToken returns sub when present", async () => {
    const id = await service.decodeToken("tok");
    expect(id).toBe("user-id");
  });

  it("decodeToken returns raw result when sub absent", async () => {
    const payload: { foo: number } = { foo: 1 };
    jest.spyOn(jwt, "verifyAsync").mockResolvedValueOnce(payload as never);
    const id = await service.decodeToken("tok");
    expect(id).toBe(payload);
  });

  it("decodeToken throws BadRequest on error", async () => {
    jest.spyOn(jwt, "verifyAsync").mockRejectedValueOnce(new Error("bad"));
    await expect(service.decodeToken("tok")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("hashPassword uses configured salts", async () => {
    const hashed = await service.hashPassword("p");
    expect(hashed).toBe("hashed");
  });

  it("comparePassword resolves when valid and throws when invalid", async () => {
    await expect(service.comparePassword("p", "h")).resolves.toBeUndefined();
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(service.comparePassword("p", "h")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("generateRandomPassword respects configured size and diversity", () => {
    const pwd = service.generateRandomPassword();
    expect(pwd).toHaveLength(12);
    expect(/[a-z]/.test(pwd)).toBeTruthy();
    expect(/[A-Z]/.test(pwd)).toBeTruthy();
    expect(/[0-9]/.test(pwd)).toBeTruthy();
    expect(/[^A-Za-z0-9]/.test(pwd)).toBeTruthy();
  });
});
