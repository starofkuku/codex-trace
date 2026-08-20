import type { CodexSessionInfo } from "../../shared/types";

export type SessionFilter = "all" | "active" | "recent";

/** Number of sessions shown by the Recent picker filter. */
export const RECENT_SESSION_LIMIT = 10;

function sessionTimestamp(session: CodexSessionInfo): number | null {
  const timestamp = Date.parse(session.start_time);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function filterSessions(
  sessions: CodexSessionInfo[],
  filter: SessionFilter,
): CodexSessionInfo[] {
  if (filter === "active") {
    return sessions.filter((session) => session.is_ongoing);
  }

  if (filter === "recent") {
    return sessions
      .map((session, index) => ({ session, index, timestamp: sessionTimestamp(session) }))
      .toSorted((a, b) => {
        if (a.timestamp !== null && b.timestamp !== null && a.timestamp !== b.timestamp) {
          return b.timestamp - a.timestamp;
        }
        if (a.timestamp !== null && b.timestamp === null) return -1;
        if (a.timestamp === null && b.timestamp !== null) return 1;
        return a.index - b.index;
      })
      .slice(0, RECENT_SESSION_LIMIT)
      .map(({ session }) => session);
  }

  return sessions;
}
