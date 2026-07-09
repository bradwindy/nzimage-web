import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Dropdown, type DropdownOption } from "./Dropdown";

const options: DropdownOption[] = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

function ControlledDropdown() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("a");
  return (
    <Dropdown
      label="Choice"
      value={value}
      options={options}
      onChange={setValue}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
    />
  );
}

describe("Dropdown", () => {
  it("shows the active option's label on the closed trigger", () => {
    render(
      <Dropdown
        label="Choice"
        value="a"
        options={options}
        onChange={() => {}}
        open={false}
        onToggle={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Option A" })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls onToggle when the trigger is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <Dropdown
        label="Choice"
        value="a"
        options={options}
        onChange={() => {}}
        open={false}
        onToggle={onToggle}
        onClose={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Option A" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders a listbox of options with the active one marked selected when open", () => {
    render(
      <Dropdown
        label="Choice"
        value="a"
        options={options}
        onChange={() => {}}
        open
        onToggle={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option A" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("option", { name: "Option B" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("calls onChange and onClose when an option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(
      <Dropdown
        label="Choice"
        value="a"
        options={options}
        onChange={onChange}
        open
        onToggle={() => {}}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole("option", { name: "Option B" }));

    expect(onChange).toHaveBeenCalledWith("b");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape while open", async () => {
    const user = userEvent.setup();
    render(<ControlledDropdown />);

    await user.click(screen.getByRole("button", { name: "Option A" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ControlledDropdown />
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Option A" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selecting an option through the controlled wrapper updates the trigger label", async () => {
    const user = userEvent.setup();
    render(<ControlledDropdown />);

    await user.click(screen.getByRole("button", { name: "Option A" }));
    await user.click(screen.getByRole("option", { name: "Option B" }));

    expect(screen.getByRole("button", { name: "Option B" })).toBeInTheDocument();
  });
});
