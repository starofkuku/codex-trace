import type { CodexSessionInfo } from "../../shared/types";
import { shortPath } from "../../shared/format";
import {
  sessionActivityDateGroup,
  sortSessionsByActivity,
  type SessionSortOrder,
} from "./sessionFilter";

export type { SessionSortOrder } from "./sessionFilter";

export type SessionGroupMode = "directory" | "date";

export interface SessionGroup {
  key: string;
  label: string;
  title: string;
  items: CodexSessionInfo[];
}

export function groupSessions(
  sessions: CodexSessionInfo[],
  mode: SessionGroupMode,
  sortOrder: SessionSortOrder = "newest",
): SessionGroup[] {
  const groups = new Map<string, SessionGroup>();

  for (const session of sortSessionsByActivity(sessions, sortOrder)) {
    const directory = session.cwd?.trim();
    const key =
      mode === "directory"
        ? directory || "__unknown_directory__"
        : sessionActivityDateGroup(session);
    const label =
      mode === "directory" ? (directory ? shortPath(directory) : "Unknown directory") : key;
    const title = mode === "directory" ? directory || "Unknown directory" : key;

    const existing = groups.get(key);
    if (existing) {
      existing.items.push(session);
    } else {
      groups.set(key, { key, label, title, items: [session] });
    }
  }

  return Array.from(groups.values());
}

export function flattenSessionGroups(groups: SessionGroup[]): CodexSessionInfo[] {
  return groups.flatMap((group) => group.items);
}
