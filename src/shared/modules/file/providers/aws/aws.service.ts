import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileStorageProvider } from "..";

@Injectable()
export class AwsService implements FileStorageProvider {
  private s3: S3Client;
  private bucket: string;
  private region: string;

  public constructor(private readonly configService: ConfigService) {
    if (this.configService.get<string>("env") != "production") return;
    this.region = this.configService.get<string>("aws.region")!;
    this.bucket = this.configService.get<string>("aws.s3Bucket")!;
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>("aws.accessKeyId")!,
        secretAccessKey: this.configService.get<string>("aws.secretAccessKey")!,
      },
    });
  }

  public async upload(file: Express.Multer.File): Promise<string> {
    const key = `${Date.now()}-${file.originalname}`;
    const uploader = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
      partSize: 5 * 1024 * 1024,
    });
    await uploader.done();
    return encodeURI(
      `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    );
  }

  public async delete(target: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: new URL(target).pathname.substring(1),
      }),
    );
  }
}
