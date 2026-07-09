import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders as a switch reflecting the checked state", () => {
    render(<Toggle checked aria-label="Dark mode" onChange={() => {}} />);
    const toggle = screen.getByRole("switch", { name: "Dark mode" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the inverted value on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} aria-label="Dark mode" onChange={onChange} />);

    await user.click(screen.getByRole("switch", { name: "Dark mode" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not call onChange when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} disabled aria-label="Dark mode" onChange={onChange} />);

    await user.click(screen.getByRole("switch", { name: "Dark mode" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("is keyboard-activatable via Space", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} aria-label="Dark mode" onChange={onChange} />);

    screen.getByRole("switch", { name: "Dark mode" }).focus();
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
