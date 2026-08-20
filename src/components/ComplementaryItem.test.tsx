import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AgentMessage } from "../../shared/types";
import { ComplementaryItem } from "./ComplementaryItem";

function makeMsg(overrides: Partial<AgentMessage> = {}): AgentMessage {
  return {
    text: "INLINE_PROSE",
    phase: "commentary",
    timestamp: "2026-04-26T10:00:00Z",
    is_reasoning: false,
    order: 0,
    ...overrides,
  };
}

describe("ComplementaryItem", () => {
  it("shows the assistant prose inline by default with no interaction", () => {
    render(<ComplementaryItem msg={makeMsg()} />);
    // Prose is visible immediately — never gated behind an expand/collapse chevron.
    expect(screen.getByText("INLINE_PROSE")).toBeInTheDocument();
    expect(screen.getByText("Complementary")).toBeInTheDocument();
    expect(document.querySelector(".complementary-item__chevron")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Copy Complementary content" }).nextElementSibling,
    ).toHaveClass("complementary-item__time");
  });

  it("renders markdown in the prose", () => {
    const { container } = render(<ComplementaryItem msg={makeMsg({ text: "**bold words**" })} />);
    expect(container.querySelector("strong")).toHaveTextContent("bold words");
  });

  it("omits the timestamp when none is present", () => {
    render(<ComplementaryItem msg={makeMsg({ timestamp: "" })} />);
    expect(document.querySelector(".complementary-item__time")).toBeNull();
    expect(screen.getByRole("button", { name: "Copy Complementary content" })).toBeInTheDocument();
  });

  it("copies the complete original message", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const text = "First line\n\n```ts\nconst value = 1;\n```";
    render(<ComplementaryItem msg={makeMsg({ text })} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy Complementary content" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(text));
    expect(screen.getByRole("button", { name: "Copied Complementary content" })).toBeVisible();
  });
});
