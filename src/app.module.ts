import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppConfig } from "./config/app.config";
import { DatabaseConfig } from "./config/db.config";
import { CoreModule } from "./core/core.module";
import { FileModule } from './shared/modules/file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [AppConfig, DatabaseConfig] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("mongo.uri"),
      }),
    }),
    CoreModule,
    FileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
