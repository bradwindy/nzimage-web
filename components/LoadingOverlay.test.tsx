import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingOverlay } from "./LoadingOverlay";

describe("LoadingOverlay", () => {
  it("renders a status region with loading text", () => {
    render(<LoadingOverlay />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading NZ Image Slideshow…");
  });
});
