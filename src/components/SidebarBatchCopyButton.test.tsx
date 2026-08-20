import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarBatchCopyButton } from "./SidebarBatchCopyButton";

describe("SidebarBatchCopyButton", () => {
  it("enters session selection mode", () => {
    const onClick = vi.fn();
    render(<SidebarBatchCopyButton active={false} selectedCount={0} onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Select session IDs to copy" });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("describes how many selected IDs will be copied", () => {
    render(<SidebarBatchCopyButton active selectedCount={2} onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Copy 2 selected session IDs" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
