import "reflect-metadata";
import { jsonObject, jsonMember } from "typedjson";

@jsonObject
export class NZImageResult {
  @jsonMember(Number)
  public id: number;

  @jsonMember(String)
  public title: string;

  @jsonMember(String)
  public description?: string;

  @jsonMember(String, { name: "thumbnail_url" })
  public thumbnailUrl: string;

  @jsonMember(String, { name: "large_thumbnail_url" })
  public largeThumbnailUrl: string;

  @jsonMember(String, { name: "display_collection" })
  public displayCollection?: string;

  constructor(
    id: number,
    title: string,
    description: string,
    thumbnailUrl: string,
    largeThumbnailUrl: string,
    displayCollection: string
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.thumbnailUrl = thumbnailUrl;
    this.largeThumbnailUrl = largeThumbnailUrl;
    this.displayCollection = displayCollection;
  }
}
