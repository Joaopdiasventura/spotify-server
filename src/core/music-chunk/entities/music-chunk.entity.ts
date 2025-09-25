import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class MusicChunk extends Document<string, MusicChunk, MusicChunk> {
  @Prop({ required: true })
  public url: string;

  @Prop({ required: true })
  public duration: number;

  @Prop({ required: true, index: true, type: String, ref: "Music" })
  public music: string;
}

export const MusicChunkSchema = SchemaFactory.createForClass(MusicChunk);
