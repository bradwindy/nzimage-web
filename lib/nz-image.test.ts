import { describe, it, expect } from "vitest";
import { parseNZImage } from "./nz-image";

const validRaw = {
  id: 7,
  title: "A photo",
  thumbnail_url: "https://example.test/t.jpg",
  large_thumbnail_url: "https://example.test/l.jpg",
  description: "A description",
  display_collection: "Some Collection",
  landing_url: "https://example.test/item",
  creator: ["Ansel Adams"],
  date: ["1941"],
  subject: ["Mountains", "Snow"],
};

describe("parseNZImage", () => {
  it("maps snake_case upstream JSON to the camelCase interface", () => {
    expect(parseNZImage(validRaw)).toEqual({
      id: 7,
      title: "A photo",
      thumbnailUrl: "https://example.test/t.jpg",
      largeThumbnailUrl: "https://example.test/l.jpg",
      description: "A description",
      displayCollection: "Some Collection",
      landingUrl: "https://example.test/item",
      creator: ["Ansel Adams"],
      date: ["1941"],
      subject: ["Mountains", "Snow"],
    });
  });

  it("leaves optionals undefined when absent", () => {
    const minimal = {
      id: 1,
      title: "t",
      thumbnail_url: "a",
      large_thumbnail_url: "b",
    };
    const parsed = parseNZImage(minimal);
    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({ id: 1, title: "t", thumbnailUrl: "a", largeThumbnailUrl: "b" });
    expect(parsed?.description).toBeUndefined();
    expect(parsed?.displayCollection).toBeUndefined();
    expect(parsed?.creator).toBeUndefined();
  });

  it("returns null for non-object input", () => {
    expect(parseNZImage(null)).toBeNull();
    expect(parseNZImage(undefined)).toBeNull();
    expect(parseNZImage("string")).toBeNull();
    expect(parseNZImage(123)).toBeNull();
  });

  it("returns null when a required field is missing or mistyped", () => {
    expect(parseNZImage({ ...validRaw, id: "7" })).toBeNull();
    expect(parseNZImage({ ...validRaw, title: 5 })).toBeNull();
    const { large_thumbnail_url, ...noLarge } = validRaw;
    void large_thumbnail_url;
    expect(parseNZImage(noLarge)).toBeNull();
    const { thumbnail_url, ...noThumb } = validRaw;
    void thumbnail_url;
    expect(parseNZImage(noThumb)).toBeNull();
  });

  it("drops optional arrays that aren't all strings, but keeps the record", () => {
    const parsed = parseNZImage({ ...validRaw, creator: ["ok", 3], date: "not-an-array" });
    expect(parsed).not.toBeNull();
    expect(parsed?.creator).toBeUndefined();
    expect(parsed?.date).toBeUndefined();
    expect(parsed?.subject).toEqual(["Mountains", "Snow"]);
  });

  it("drops a mistyped optional description", () => {
    expect(parseNZImage({ ...validRaw, description: 123 })?.description).toBeUndefined();
  });
});
