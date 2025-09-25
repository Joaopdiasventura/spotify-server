import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class Music extends Document<string, Music, Music> {
  @Prop({ required: true })
  public title: string;

  @Prop({ required: true })
  public description: string;

  @Prop({ required: true })
  public artist: string;

  @Prop({ required: true })
  public lyrics: string;

  @Prop({ required: true })
  public thumbnail: string;

  @Prop({ required: true })
  public duration: number;
}

export const MusicSchema = SchemaFactory.createForClass(Music);
