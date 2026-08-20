import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarDirectoryActions } from "./SidebarDirectoryActions";

describe("SidebarDirectoryActions", () => {
  it("runs the expand, collapse, and sort actions", () => {
    const onExpandAll = vi.fn();
    const onCollapseAll = vi.fn();
    const onToggleSort = vi.fn();

    render(
      <SidebarDirectoryActions
        sortOrder="newest"
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        onToggleSort={onToggleSort}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Expand all directories" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse all directories" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Newest activity first; switch to oldest first",
      }),
    );

    expect(onExpandAll).toHaveBeenCalledOnce();
    expect(onCollapseAll).toHaveBeenCalledOnce();
    expect(onToggleSort).toHaveBeenCalledOnce();
  });

  it("describes the active oldest-first order", () => {
    render(
      <SidebarDirectoryActions
        sortOrder="oldest"
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onToggleSort={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Oldest activity first; switch to newest first",
      }),
    ).toHaveAttribute("title", "Oldest activity first; switch to newest first");
  });
});
