import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarToggle } from "./SidebarToggle";

describe("SidebarToggle", () => {
  it("offers a collapse action when the sidebar is expanded", () => {
    render(<SidebarToggle collapsed={false} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });

  it("offers an expand action and notifies the caller when clicked", () => {
    const onToggle = vi.fn();
    render(<SidebarToggle collapsed onToggle={onToggle} />);

    const button = screen.getByRole("button", { name: "Expand sidebar" });
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
