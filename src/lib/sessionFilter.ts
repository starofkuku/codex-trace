import type { CodexSessionInfo } from "../../shared/types";

export type SessionFilter = "all" | "active" | "recent";

/** Number of sessions shown by the Recent picker filter. */
export const RECENT_SESSION_LIMIT = 10;

function sessionTimestamp(session: CodexSessionInfo): number | null {
  const timestamp = Date.parse(session.last_activity_time);
  return Number.isNaN(timestamp) ? null : timestamp;
}

/** Sort sessions by their latest valid rollout entry, preserving input order for ties. */
export function sortSessionsByActivity(sessions: CodexSessionInfo[]): CodexSessionInfo[] {
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
    .map(({ session }) => session);
}

/** Activity date in the browser's local timezone, matching the displayed activity time. */
export function sessionActivityDateGroup(session: CodexSessionInfo): string {
  const timestamp = sessionTimestamp(session);
  if (timestamp === null) return session.date_group || "unknown";

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export function filterSessions(
  sessions: CodexSessionInfo[],
  filter: SessionFilter,
): CodexSessionInfo[] {
  const sorted = sortSessionsByActivity(sessions);

  if (filter === "active") {
    return sorted.filter((session) => session.is_ongoing);
  }

  if (filter === "recent") {
    return sorted.slice(0, RECENT_SESSION_LIMIT);
  }

  return sorted;
}
