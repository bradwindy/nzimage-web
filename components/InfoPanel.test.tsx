import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoPanel } from "./InfoPanel";
import { renderWithSettings } from "@/lib/test-utils";
import type { NZImage } from "@/lib/nz-image";

const baseImage: NZImage = {
  id: 1,
  title: "A Heritage Photo",
  thumbnailUrl: "https://example.com/thumb.jpg",
  largeThumbnailUrl: "https://example.com/large.jpg",
};

describe("InfoPanel", () => {
  it("renders the title", () => {
    renderWithSettings(<InfoPanel image={baseImage} />);
    expect(screen.getByRole("heading", { name: "A Heritage Photo" })).toBeInTheDocument();
  });

  it("shows a description at or under the char limit in full, with no toggle", () => {
    const image = { ...baseImage, description: "A short description." };
    renderWithSettings(<InfoPanel image={image} />);

    expect(screen.getByText("A short description.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See more" })).not.toBeInTheDocument();
  });

  it("truncates a description over the char limit at a word boundary, with a See more/See less toggle", async () => {
    const user = userEvent.setup();
    const description =
      "This description is intentionally long enough that it exceeds the default one " +
      "hundred character limit set for descriptions in this component so truncation kicks in.";
    const image = { ...baseImage, description };
    renderWithSettings(<InfoPanel image={image} />);

    expect(screen.queryByText(description)).not.toBeInTheDocument();
    const seeMore = screen.getByRole("button", { name: "See more" });
    expect(seeMore).toBeInTheDocument();

    await user.click(seeMore);

    expect(screen.getByText(description)).toBeInTheDocument();
    const seeLess = screen.getByRole("button", { name: "See less" });

    await user.click(seeLess);

    expect(screen.queryByText(description)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See more" })).toBeInTheDocument();
  });

  describe("metadata rows", () => {
    const image = {
      ...baseImage,
      creator: ["Jane Doe"],
      date: ["1900"],
      subject: [] as string[],
    };

    it("are hidden when infoDensity is 'less' (default)", () => {
      renderWithSettings(<InfoPanel image={image} />);
      expect(screen.queryByText("Creator:")).not.toBeInTheDocument();
      expect(screen.queryByText("Date:")).not.toBeInTheDocument();
    });

    it("are shown when infoDensity is 'more', skipping empty arrays", () => {
      renderWithSettings(<InfoPanel image={image} />, { infoDensity: "more" });

      expect(screen.getByText("Creator:")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("Date:")).toBeInTheDocument();
      expect(screen.queryByText("Subjects:")).not.toBeInTheDocument();
    });
  });

  it("does not render a display collection or landing link when absent", () => {
    renderWithSettings(<InfoPanel image={baseImage} />);
    expect(screen.queryByText("Auckland Libraries")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the display collection when present", () => {
    renderWithSettings(
      <InfoPanel image={{ ...baseImage, displayCollection: "Auckland Libraries" }} />
    );
    expect(screen.getByText("Auckland Libraries")).toBeInTheDocument();
  });

  it("renders a landing link with the correct href and aria-label when landingUrl is present", () => {
    renderWithSettings(
      <InfoPanel image={{ ...baseImage, landingUrl: "https://natlib.govt.nz/records/1" }} />
    );
    const link = screen.getByRole("link", {
      name: `View "${baseImage.title}" on the source website`,
    });
    expect(link).toHaveAttribute("href", "https://natlib.govt.nz/records/1");
  });
});
