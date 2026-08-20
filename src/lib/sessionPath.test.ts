import { describe, expect, it } from "vitest";
import { sessionRelativePath } from "./sessionPath";

describe("sessionRelativePath", () => {
  it("removes the path through the sessions directory", () => {
    expect(sessionRelativePath("/home/user/.codex/sessions/2026/08/20/rollout-a.jsonl")).toBe(
      "2026/08/20/rollout-a.jsonl",
    );
  });

  it("handles Windows separators", () => {
    expect(
      sessionRelativePath("C:\\Users\\user\\.codex\\sessions\\2026\\08\\20\\rollout-a.jsonl"),
    ).toBe("2026/08/20/rollout-a.jsonl");
  });

  it("uses the date group when a custom sessions directory has another name", () => {
    expect(sessionRelativePath("/data/codex/rollout-a.jsonl", "2026/08/20")).toBe(
      "2026/08/20/rollout-a.jsonl",
    );
  });
});
