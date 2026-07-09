import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders its children", () => {
    render(
      <Modal isOpen onClose={() => {}} titleId="t">
        <h2 id="t">Title</h2>
        <p>Body content</p>
      </Modal>
    );

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("opens the underlying <dialog> when isOpen is true", () => {
    render(
      <Modal isOpen onClose={() => {}} titleId="t">
        <h2 id="t">Title</h2>
      </Modal>
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("does not open the underlying <dialog> when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} titleId="t">
        <h2 id="t">Title</h2>
      </Modal>
    );

    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  it("calls onClose when clicking the dialog backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} titleId="t">
        <h2 id="t">Title</h2>
      </Modal>
    );

    await user.click(screen.getByRole("dialog"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the dialog content", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} titleId="t">
        <h2 id="t">Title</h2>
      </Modal>
    );

    await user.click(screen.getByRole("heading", { name: "Title" }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
