import "reflect-metadata";
import { jsonObject, jsonMember } from "typedjson";

@jsonObject
export class NZImageResult {
  @jsonMember(Number)
  public readonly id: number;

  @jsonMember(String)
  public readonly title: string;

  @jsonMember(String)
  public readonly description?: string;

  @jsonMember(String, { name: "thumbnail_url" })
  public readonly thumbnailUrl: string;

  @jsonMember(String, { name: "large_thumbnail_url" })
  public readonly largeThumbnailUrl: string;

  @jsonMember(String, { name: "display_collection" })
  public readonly displayCollection?: string;

  constructor(
    id: number,
    title: string,
    thumbnailUrl: string,
    largeThumbnailUrl: string,
    description?: string,
    displayCollection?: string
  ) {
    this.id = id;
    this.title = title;
    this.thumbnailUrl = thumbnailUrl;
    this.largeThumbnailUrl = largeThumbnailUrl;
    this.description = description;
    this.displayCollection = displayCollection;
  }
}
