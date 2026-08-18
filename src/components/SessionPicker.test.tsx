import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CodexSessionInfo } from "../../shared/types";
import { SessionPicker } from "./SessionPicker";

function makeSession(name: string, isOngoing: boolean): CodexSessionInfo {
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
    start_time: "2026-08-18T12:00:00Z",
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
  showOngoingOnly: false,
  selectedIndex: 0,
  onSelectSession: vi.fn(),
  onSearchChange: vi.fn(),
  onShowOngoingOnlyChange: vi.fn(),
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
        showOngoingOnly
        sessions={[makeSession("completed", false), makeSession("running", true)]}
      />,
    );

    expect(screen.queryByText("completed")).not.toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
  });

  it("notifies the parent when the active filter is selected", () => {
    const onShowOngoingOnlyChange = vi.fn();
    render(
      <SessionPicker
        {...defaultProps}
        onShowOngoingOnlyChange={onShowOngoingOnlyChange}
        sessions={[makeSession("running", true)]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(onShowOngoingOnlyChange).toHaveBeenCalledWith(true);
  });
});
