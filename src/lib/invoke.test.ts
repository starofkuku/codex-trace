import { afterEach, describe, expect, it, vi } from "vitest";
import { invoke } from "./invoke";

describe("web invoke", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps frontend updates to the backend POST endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ updated: true, bytes: 1024 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await invoke("update_frontend");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:11424/api/frontend/update",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
