import { describe, expect, it } from "vitest";
import { FRONTEND_VERSION, versionStatus } from "./version";

describe("versionStatus", () => {
  it("reports matching versions as current", () => {
    expect(versionStatus(FRONTEND_VERSION)).toBe("current");
  });

  it("reports different versions as a mismatch", () => {
    expect(versionStatus("0.0.0")).toBe("mismatch");
  });

  it("reports a missing backend version as unknown", () => {
    expect(versionStatus()).toBe("unknown");
  });
});
