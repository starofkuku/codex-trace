import { describe, expect, it } from "vitest";
import type { CodexSessionInfo } from "../../shared/types";
import { filterSessions, RECENT_SESSION_LIMIT } from "./sessionFilter";

function makeSession(id: string, startTime: string, isOngoing = false): CodexSessionInfo {
  return {
    id,
    path: `/sessions/rollout-${id}.jsonl`,
    cwd: null,
    git_branch: null,
    originator: null,
    model: null,
    cli_version: null,
    thread_name: id,
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
    file_size_bytes: 0,
    worker_nickname: null,
    worker_role: null,
    spawned_worker_ids: [],
    date_group: "2026/08/18",
    ai_title: null,
  };
}

describe("filterSessions", () => {
  it("returns only ongoing sessions for the active filter", () => {
    const sessions = [
      makeSession("done", "2026-08-18T12:00:00Z"),
      makeSession("active", "2026-08-18T12:01:00Z", true),
    ];

    expect(filterSessions(sessions, "active").map((session) => session.id)).toEqual(["active"]);
  });

  it("returns the newest ten sessions ordered by start time", () => {
    const sessions = Array.from({ length: RECENT_SESSION_LIMIT + 1 }, (_, index) =>
      makeSession(`session-${index}`, `2026-08-18T12:${String(index).padStart(2, "0")}:00Z`),
    );

    expect(filterSessions(sessions, "recent").map((session) => session.id)).toEqual(
      Array.from(
        { length: RECENT_SESSION_LIMIT },
        (_, index) => `session-${index + 1}`,
      ).toReversed(),
    );
  });

  it("keeps sessions with invalid timestamps after dated sessions", () => {
    const sessions = [
      makeSession("invalid", "not-a-date"),
      makeSession("dated", "2026-08-18T12:00:00Z"),
    ];

    expect(filterSessions(sessions, "recent").map((session) => session.id)).toEqual([
      "dated",
      "invalid",
    ]);
  });
});
