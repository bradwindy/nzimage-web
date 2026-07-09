import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsButton } from "./SettingsButton";

describe("SettingsButton", () => {
  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SettingsButton visible onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Open settings" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is visually hidden but still present when visible is false", () => {
    render(<SettingsButton visible={false} onClick={() => {}} />);

    const button = screen.getByRole("button", { name: "Open settings" });
    expect(button).toHaveStyle({ opacity: "0", pointerEvents: "none" });
  });

  it("has no inline opacity/pointerEvents override when visible", () => {
    render(<SettingsButton visible onClick={() => {}} />);

    const button = screen.getByRole("button", { name: "Open settings" });
    expect(button.style.opacity).toBe("");
    expect(button.style.pointerEvents).toBe("");
  });
});
