import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CodexSessionInfo } from "../../shared/types";
import { RECENT_SESSION_LIMIT, type SessionFilter } from "../lib/sessionFilter";
import { SessionPicker } from "./SessionPicker";

function makeSession(
  name: string,
  isOngoing: boolean,
  startTime = "2026-08-18T12:00:00Z",
): CodexSessionInfo {
  return {
    id: name,
    path: `/sessions/2026/08/18/rollout-${name}.jsonl`,
    cwd: `/workspace/${name}`,
    git_branch: "main",
    originator: null,
    model: "gpt-5",
    cli_version: null,
    thread_name: name,
    turn_count: 1,
    start_time: startTime,
    end_time: null,
    total_tokens: null,
    is_ongoing: isOngoing,
    is_external_worker: false,
    is_inline_worker: false,
    is_headless: false,
    is_archived: false,
    approval_mode: null,
    history_base_thread_id: null,
    file_size_bytes: 100,
    worker_nickname: null,
    worker_role: null,
    spawned_worker_ids: [],
    date_group: "2026/08/18",
    ai_title: null,
  };
}

const defaultProps = {
  loading: false,
  searchQuery: "",
  sessionFilter: "all" as SessionFilter,
  selectedIndex: 0,
  onSelectSession: vi.fn(),
  onSearchChange: vi.fn(),
  onSessionFilterChange: vi.fn(),
};

describe("SessionPicker", () => {
  it("shows all sessions by default", () => {
    render(
      <SessionPicker
        {...defaultProps}
        sessions={[makeSession("completed", false), makeSession("running", true)]}
      />,
    );

    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows only active sessions when the active filter is enabled", () => {
    render(
      <SessionPicker
        {...defaultProps}
        sessionFilter="active"
        sessions={[makeSession("completed", false), makeSession("running", true)]}
      />,
    );

    expect(screen.queryByText("completed")).not.toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
  });

  it("notifies the parent when the active filter is selected", () => {
    const onSessionFilterChange = vi.fn();
    render(
      <SessionPicker
        {...defaultProps}
        onSessionFilterChange={onSessionFilterChange}
        sessions={[makeSession("running", true)]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(onSessionFilterChange).toHaveBeenCalledWith("active");
  });

  it("shows only the most recent sessions when the recent filter is enabled", () => {
    const sessions = Array.from({ length: RECENT_SESSION_LIMIT + 1 }, (_, index) =>
      makeSession(`session-${index}`, false, `2026-08-18T12:${String(index).padStart(2, "0")}:00Z`),
    );

    render(<SessionPicker {...defaultProps} sessionFilter="recent" sessions={sessions} />);

    expect(screen.queryByText("session-0")).not.toBeInTheDocument();
    expect(screen.getByText("session-1")).toBeInTheDocument();
    expect(screen.getByText(`session-${RECENT_SESSION_LIMIT}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recent" })).toHaveAttribute("aria-pressed", "true");
  });

  it("notifies the parent when the recent filter is selected", () => {
    const onSessionFilterChange = vi.fn();
    render(
      <SessionPicker
        {...defaultProps}
        onSessionFilterChange={onSessionFilterChange}
        sessions={[makeSession("recent", false)]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Recent" }));
    expect(onSessionFilterChange).toHaveBeenCalledWith("recent");
  });
});
