import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CodexSessionInfo } from "../shared/types";

const mocks = vi.hoisted(() => ({
  loadSession: vi.fn(),
  loadMore: vi.fn().mockResolvedValue(0),
  discoverSessions: vi.fn(),
  updateSessionOngoing: vi.fn(),
  setSearchQuery: vi.fn(),
  setSessionFilter: vi.fn(),
  sessions: [] as CodexSessionInfo[],
}));

vi.mock("./hooks/useSession", () => ({
  useSession: () => ({
    session: null,
    loading: false,
    loadingMore: false,
    sessionPath: "",
    loadSession: mocks.loadSession,
    loadMore: mocks.loadMore,
  }),
}));

vi.mock("./hooks/usePicker", () => ({
  resolveSessionsDir: vi.fn().mockResolvedValue(""),
  usePicker: () => ({
    sessions: mocks.sessions,
    allSessions: mocks.sessions,
    loading: false,
    searchQuery: "",
    sessionsDir: "/sessions",
    sessionFilter: "all",
    setSearchQuery: mocks.setSearchQuery,
    setSessionFilter: mocks.setSessionFilter,
    discoverSessions: mocks.discoverSessions,
    updateSessionOngoing: mocks.updateSessionOngoing,
  }),
}));

import { App } from "./App";

function makeSession(): CodexSessionInfo {
  return {
    id: "01900000-0000-7000-8000-000000000001",
    path: "/sessions/2026/08/20/rollout-session.jsonl",
    cwd: "/workspace/project",
    git_branch: "main",
    originator: null,
    model: "gpt-5",
    cli_version: null,
    thread_name: "Batch copy session",
    last_user_message: "Copy this session",
    turn_count: 1,
    start_time: "2026-08-20T10:00:00Z",
    end_time: "2026-08-20T10:01:00Z",
    total_tokens: 100,
    is_ongoing: false,
    is_external_worker: false,
    is_inline_worker: false,
    worker_nickname: null,
    worker_role: null,
    spawned_worker_ids: [],
    date_group: "2026/08/20",
    ai_title: null,
    is_headless: false,
    is_archived: false,
    approval_mode: null,
    history_base_thread_id: null,
    last_activity_time: "2026-08-20T10:01:00Z",
    file_size_bytes: 1024,
  };
}

describe("App session ID batch copy", () => {
  it("copies selected IDs, exits selection mode, and confirms success", async () => {
    const session = makeSession();
    mocks.sessions.splice(0, mocks.sessions.length, session);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Select session IDs to copy" }));
    const checkbox = screen.getByRole("checkbox", { name: `Select session ${session.id}` });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Copy 1 selected session ID" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(session.id));
    expect(screen.queryByRole("checkbox", { name: `Select session ${session.id}` })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Copied 1 session ID");
    expect(mocks.loadSession).not.toHaveBeenCalled();
  });
});
