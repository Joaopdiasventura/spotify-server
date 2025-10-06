import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class Playlist extends Document<string, Playlist, Playlist> {
  @Prop({ required: true, index: true, type: String, ref: "User" })
  public user: string;

  @Prop({ required: true })
  public name: string;

  @Prop({ required: true, type: [String], ref: "Song" })
  public songs: string[];

  @Prop({ required: true })
  public isPublic: boolean;
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);
