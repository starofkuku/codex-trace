import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CodexSessionInfo } from "../../shared/types";
import { SidebarTree } from "./SidebarTree";

function makeSession(overrides: Partial<CodexSessionInfo> = {}): CodexSessionInfo {
  return {
    id: "abc123",
    path: "/sessions/2026/04/26/rollout-abc.jsonl",
    cwd: "/Users/user/myproject",
    git_branch: "main",
    originator: null,
    model: "gpt-4",
    cli_version: null,
    thread_name: null,
    last_user_message: "Latest user request",
    turn_count: 3,
    start_time: "2026-04-26T10:00:00Z",
    end_time: null,
    total_tokens: null,
    is_ongoing: false,
    is_external_worker: false,
    is_inline_worker: false,
    is_headless: false,
    is_archived: false,
    approval_mode: null,
    history_base_thread_id: null,
    last_activity_time: "2026-04-26T10:00:00Z",
    file_size_bytes: 1_572_864,
    worker_nickname: null,
    worker_role: null,
    spawned_worker_ids: [],
    date_group: "2026/04/26",
    ai_title: null,
    ...overrides,
  };
}

describe("SidebarTree", () => {
  it("shows empty state when no sessions", () => {
    render(
      <SidebarTree
        sessions={[]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("No sessions")).toBeInTheDocument();
  });

  it("renders the date group header", () => {
    render(
      <SidebarTree
        sessions={[makeSession()]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("2026/04/26")).toBeInTheDocument();
  });

  it("renders the latest user message when no thread_name exists", () => {
    render(
      <SidebarTree
        sessions={[makeSession()]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("Latest user request")).toHaveAttribute("title", "Latest user request");
  });

  it("renders the session file size", () => {
    render(
      <SidebarTree
        sessions={[makeSession()]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("1.5 MB")).toBeInTheDocument();
  });

  it("prefers thread_name over cwd", () => {
    render(
      <SidebarTree
        sessions={[makeSession({ thread_name: "My Task" })]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("My Task")).toBeInTheDocument();
  });

  it("falls back to id prefix when thread_name and user message are absent", () => {
    render(
      <SidebarTree
        sessions={[makeSession({ thread_name: null, last_user_message: null })]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("abc123".slice(0, 8))).toBeInTheDocument();
  });

  it("calls onSelectSession when a session row is clicked", () => {
    const onSelect = vi.fn();
    const session = makeSession({ thread_name: "My Task" });
    render(
      <SidebarTree
        sessions={[session]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={onSelect}
        onToggleDate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("My Task").closest('[role="button"]')!);
    expect(onSelect).toHaveBeenCalledWith(session);
  });

  it("hides sessions when their date group is collapsed", () => {
    render(
      <SidebarTree
        sessions={[makeSession({ thread_name: "Hidden" })]}
        selectedPath={null}
        collapsedDates={new Set(["2026/04/26"])}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("calls onToggleDate when the date header is clicked", () => {
    const onToggle = vi.fn();
    render(
      <SidebarTree
        sessions={[makeSession()]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("2026/04/26"));
    expect(onToggle).toHaveBeenCalledWith("2026/04/26");
  });

  it("applies selected class to the active session", () => {
    const session = makeSession({ thread_name: "Active" });
    render(
      <SidebarTree
        sessions={[session]}
        selectedPath={session.path}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    const el = screen.getByText("Active").closest(".sidebar-tree__session");
    expect(el).toHaveClass("sidebar-tree__session--selected");
  });

  it("groups sessions from different dates under separate headers", () => {
    const sessions = [
      makeSession({
        path: "/a.jsonl",
        thread_name: "Session A",
        last_activity_time: "2026-04-25T12:00:00Z",
      }),
      makeSession({
        path: "/b.jsonl",
        thread_name: "Session B",
        last_activity_time: "2026-04-26T12:00:00Z",
      }),
    ];
    render(
      <SidebarTree
        sessions={sessions}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("2026/04/25")).toBeInTheDocument();
    expect(screen.getByText("2026/04/26")).toBeInTheDocument();
    expect(screen.getByText("Session A")).toBeInTheDocument();
    expect(screen.getByText("Session B")).toBeInTheDocument();
  });

  it("orders and groups sessions by latest activity", () => {
    const { container } = render(
      <SidebarTree
        sessions={[
          makeSession({
            path: "/new-session.jsonl",
            thread_name: "New session",
            start_time: "2026-08-20T08:00:00Z",
            last_activity_time: "2026-08-20T08:01:00Z",
            date_group: "2026/08/20",
          }),
          makeSession({
            path: "/resumed-session.jsonl",
            thread_name: "Resumed old session",
            start_time: "2026-01-01T08:00:00Z",
            last_activity_time: "2026-08-20T09:00:00Z",
            date_group: "2026/01/01",
          }),
          makeSession({
            path: "/yesterday.jsonl",
            thread_name: "Yesterday",
            start_time: "2026-08-19T08:00:00Z",
            last_activity_time: "2026-08-19T09:00:00Z",
            date_group: "2026/08/19",
          }),
        ]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );

    expect(
      Array.from(
        container.querySelectorAll(".sidebar-tree__group-label"),
        (node) => node.textContent,
      ),
    ).toEqual(["2026/08/20", "2026/08/19"]);
    expect(
      Array.from(
        container.querySelectorAll(".sidebar-tree__session-label"),
        (node) => node.textContent,
      ),
    ).toEqual(["Resumed old session", "New session", "Yesterday"]);
  });

  it("hides inline workers from the top-level list", () => {
    const worker = makeSession({
      id: "worker1",
      path: "/sessions/2026/04/26/rollout-worker.jsonl",
      thread_name: "Worker Session",
      is_inline_worker: true,
    });
    const parent = makeSession({
      id: "parent1",
      path: "/sessions/2026/04/26/rollout-parent.jsonl",
      thread_name: "Parent Session",
      spawned_worker_ids: ["worker1"],
    });
    render(
      <SidebarTree
        sessions={[parent, worker]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("Parent Session")).toBeInTheDocument();
    expect(screen.queryByText("Worker Session")).not.toBeInTheDocument();
  });

  it("shows inline workers nested under parent when toggle is clicked", () => {
    const worker = makeSession({
      id: "worker1",
      path: "/sessions/2026/04/26/rollout-worker.jsonl",
      thread_name: "Parent Session",
      is_inline_worker: true,
      worker_nickname: "Parfit",
    });
    const parent = makeSession({
      id: "parent1",
      path: "/sessions/2026/04/26/rollout-parent.jsonl",
      thread_name: "Parent Session",
      spawned_worker_ids: ["worker1"],
    });
    render(
      <SidebarTree
        sessions={[parent, worker]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/1 workers/));
    expect(screen.getByText("Parfit (worker1)")).toBeInTheDocument();
    expect(
      screen.getByText("Parfit (worker1)").closest(".sidebar-tree__session--child"),
    ).toBeTruthy();
    expect(screen.queryAllByText("Parent Session")).toHaveLength(1);
  });

  it("shows worker badge on external worker sessions", () => {
    render(
      <SidebarTree
        sessions={[makeSession({ is_external_worker: true, thread_name: "Review Session" })]}
        selectedPath={null}
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );
    expect(screen.getByText("worker")).toBeInTheDocument();
  });

  it("groups sessions by directory when requested", () => {
    render(
      <SidebarTree
        sessions={[
          makeSession({ thread_name: "First", cwd: "/workspace/project-a" }),
          makeSession({
            id: "second",
            path: "/second.jsonl",
            thread_name: "Second",
            cwd: "/workspace/project-b",
          }),
        ]}
        selectedPath={null}
        groupMode="directory"
        collapsedDates={new Set()}
        onSelectSession={vi.fn()}
        onToggleDate={vi.fn()}
      />,
    );

    expect(screen.getByText("project-a").closest("[title]"))?.toHaveAttribute(
      "title",
      "/workspace/project-a",
    );
    expect(screen.getByText("project-b").closest("[title]"))?.toHaveAttribute(
      "title",
      "/workspace/project-b",
    );
  });
});
