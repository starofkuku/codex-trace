import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewState } from "../../shared/types";
import { scrollContent, ViewToolbar } from "./ViewToolbar";

function createScrollableElement(className: string) {
  const el = document.createElement("div");
  el.className = className;
  Object.defineProperty(el, "scrollHeight", { value: 2000, configurable: true });
  el.scrollTo = vi.fn();
  document.body.appendChild(el);
  return el;
}

describe("ViewToolbar scroll buttons", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls the message list to the top when Top is clicked", () => {
    const el = createScrollableElement("message-list");
    render(
      <ViewToolbar
        view="list"
        hasSession
        onGoToSessions={vi.fn()}
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Top" }));

    expect(el.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("scrolls the message list to the bottom when Bottom is clicked", () => {
    const el = createScrollableElement("message-list");
    render(
      <ViewToolbar
        view="list"
        hasSession
        onGoToSessions={vi.fn()}
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bottom" }));

    expect(el.scrollTo).toHaveBeenCalledWith({ top: 2000, behavior: "smooth" });
  });

  it.each<[ViewState, string]>([
    ["picker", "picker__list"],
    ["list", "message-list"],
    ["detail", "turn-detail__body"],
  ])("scrolls the %s view's content container", (view, className) => {
    const el = createScrollableElement(className);

    scrollContent(view, "bottom");

    expect(el.scrollTo).toHaveBeenCalledWith({ top: 2000, behavior: "smooth" });
  });

  it("does nothing when the current view's scroll container is absent", () => {
    render(
      <ViewToolbar
        view="picker"
        hasSession={false}
        onGoToSessions={vi.fn()}
        onExpandAll={vi.fn()}
        onCollapseAll={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    expect(() => fireEvent.click(screen.getByRole("button", { name: "Bottom" }))).not.toThrow();
  });
});
