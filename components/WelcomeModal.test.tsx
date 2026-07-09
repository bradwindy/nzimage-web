import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WelcomeModal } from "./WelcomeModal";
import { WELCOME_STORAGE_KEY } from "@/lib/welcome";

describe("WelcomeModal", () => {
  it("opens on mount when the welcome key is unset", async () => {
    render(<WelcomeModal />);

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveAttribute("open")
    );
    expect(
      screen.getByRole("heading", { name: "Welcome to NZ Image Slideshow" })
    ).toBeInTheDocument();
  });

  it("does not open on mount when hasSeenWelcome is true", async () => {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, "1");

    render(<WelcomeModal />);

    await waitFor(() =>
      expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open")
    );
  });

  it("marks the welcome as seen and closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<WelcomeModal />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("open"));

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(window.localStorage.getItem(WELCOME_STORAGE_KEY)).toBe("1");
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });
});
