export interface IDatabaseConfig {
  mongo: {
    uri: string;
  };
  aws: {
    region: string;
    s3Bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export const DatabaseConfig = (): IDatabaseConfig => ({
  mongo: { uri: process.env.MONGO_URI || "mongodb://localhost:27017/spotify" },
  aws: {
    region: process.env.AWS_REGION!,
    s3Bucket: process.env.AWS_S3_BUCKET!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
