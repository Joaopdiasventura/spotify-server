import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "../email.service";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn() })),
}));

describe("EmailService", () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case "email.address":
                  return "test@example.com";
                case "email.password":
                  return "password";
                case "client.url":
                  return "http://localhost:4200";
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("sendMail delegates to transporter", async () => {
    await service.sendMail({ to: "u@u", subject: "s", html: "<p>h</p>" });
    expect(nodemailer.createTransport).toHaveBeenCalled();
    const idx = (nodemailer.createTransport as jest.Mock).mock.results.length - 1;
    const sendMailMock = ((nodemailer.createTransport as jest.Mock).mock.results[idx].value as { sendMail: jest.Mock }).sendMail;
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"EPV" <test@example.com>',
        to: "u@u",
        subject: "s",
      }),
    );
  });

  it("sendMail wraps transporter errors", async () => {
    const idx = (nodemailer.createTransport as jest.Mock).mock.results.length - 1;
    const sendMailMock = ((nodemailer.createTransport as jest.Mock).mock.results[idx].value as { sendMail: jest.Mock }).sendMail;
    sendMailMock.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      service.sendMail({ to: "u@u", subject: "s", html: "x" }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it("createNewPasswordMessage includes password and client url", () => {
    const html = service.createNewPasswordMessage("P@ss");
    expect(html).toContain("P@ss");
    expect(html).toContain("http://localhost:4200");
  });
});
