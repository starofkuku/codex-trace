import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CodexSessionInfo } from "../../shared/types";
import { RECENT_SESSION_LIMIT, type SessionFilter } from "../lib/sessionFilter";
import { SessionPicker } from "./SessionPicker";

function makeSession(
  name: string,
  isOngoing: boolean,
  startTime = "2026-08-18T12:00:00Z",
  lastActivityTime = startTime,
): CodexSessionInfo {
  return {
    id: name,
    path: `/sessions/2026/08/18/rollout-${name}.jsonl`,
    cwd: "/workspace/project",
    git_branch: "main",
    originator: null,
    model: "gpt-5",
    cli_version: null,
    thread_name: name,
    last_user_message: null,
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
    last_activity_time: lastActivityTime,
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
  groupMode: "directory" as const,
  onGroupModeChange: vi.fn(),
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

  it("orders all sessions by latest activity", () => {
    const { container } = render(
      <SessionPicker
        {...defaultProps}
        sessions={[
          makeSession("new-session", false, "2026-08-20T08:00:00Z", "2026-08-20T08:01:00Z"),
          makeSession("resumed-old-session", false, "2026-01-01T08:00:00Z", "2026-08-20T09:00:00Z"),
        ]}
      />,
    );

    expect(
      Array.from(
        container.querySelectorAll(".picker__session-preview"),
        (node) => node.textContent,
      ),
    ).toEqual(["resumed-old-session", "new-session"]);
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

  it("shows only the most recently active sessions when the recent filter is enabled", () => {
    const sessions = Array.from({ length: RECENT_SESSION_LIMIT + 1 }, (_, index) =>
      makeSession(
        `session-${index}`,
        false,
        "2026-01-01T00:00:00Z",
        `2026-08-18T12:${String(index).padStart(2, "0")}:00Z`,
      ),
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

  it("shows the latest user message with the complete text in a tooltip", () => {
    const message = "A user request that is long enough to be visually truncated by the row";
    const session = {
      ...makeSession("message-session", false),
      thread_name: null,
      last_user_message: message,
    };

    render(<SessionPicker {...defaultProps} sessions={[session]} />);

    expect(screen.getByText(message)).toHaveAttribute("title", message);
  });

  it("groups sessions by directory and exposes the full path", () => {
    const first = { ...makeSession("first", false), cwd: "/workspace/project-a" };
    const second = { ...makeSession("second", false), cwd: "/workspace/project-b" };

    render(<SessionPicker {...defaultProps} sessions={[first, second]} />);

    expect(screen.getByText("project-a")).toHaveAttribute("title", "/workspace/project-a");
    expect(screen.getByText("project-b")).toHaveAttribute("title", "/workspace/project-b");
  });

  it("notifies the parent when date grouping is selected", () => {
    const onGroupModeChange = vi.fn();
    render(
      <SessionPicker
        {...defaultProps}
        onGroupModeChange={onGroupModeChange}
        sessions={[makeSession("session", false)]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Group by date" }));
    expect(onGroupModeChange).toHaveBeenCalledWith("date");
  });

  it("marks sessions that spawned subagents", () => {
    render(
      <SessionPicker
        {...defaultProps}
        sessions={[
          {
            ...makeSession("parent", false),
            spawned_worker_ids: ["worker-1", "worker-2"],
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Uses 2 subagents")).toHaveAttribute("title", "Uses 2 subagents");
  });
});
