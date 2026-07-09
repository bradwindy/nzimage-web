import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders the title, message, and action buttons", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Reset all settings?"
        message="This can't be undone."
        confirmLabel="Reset all"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("heading", { name: "Reset all settings?" })).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset all" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("uses a custom cancelLabel when provided", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Discard changes?"
        message="Unsaved changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Reset all settings?"
        message="This can't be undone."
        confirmLabel="Reset all"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Reset all" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Reset all settings?"
        message="This can't be undone."
        confirmLabel="Reset all"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("opens the underlying <dialog> element when isOpen is true", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Reset all settings?"
        message="This can't be undone."
        confirmLabel="Reset all"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("dialog", { name: "Reset all settings?" })).toHaveAttribute("open");
  });

  it("does not open the underlying <dialog> element when isOpen is false", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Reset all settings?"
        message="This can't be undone."
        confirmLabel="Reset all"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });
});
