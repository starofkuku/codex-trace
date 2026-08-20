import { useCallback, useMemo, useState } from "react";
import type { CodexSessionInfo } from "../../shared/types";
import { formatFileSize, timeAgo } from "../../shared/format";
import { sessionDisplayName } from "../lib/sessionDisplay";
import { groupSessions, type SessionGroupMode } from "../lib/sessionGrouping";
import { OngoingDots } from "./OngoingDots";

interface SidebarTreeProps {
  sessions: CodexSessionInfo[];
  selectedPath: string | null;
  groupMode?: SessionGroupMode;
  collapsedDates: Set<string>;
  onSelectSession: (info: CodexSessionInfo) => void;
  onToggleDate: (groupKey: string) => void;
}

/** Map each parent session id → its resolved inline worker sessions. */
function buildWorkerMap(sessions: CodexSessionInfo[]): Map<string, CodexSessionInfo[]> {
  const byId = new Map(sessions.map((s) => [s.id, s]));
  const map = new Map<string, CodexSessionInfo[]>();
  for (const s of sessions) {
    if (s.spawned_worker_ids.length === 0) continue;
    const workers = s.spawned_worker_ids.flatMap((wid) => {
      const w = byId.get(wid);
      return w ? [w] : [];
    });
    if (workers.length > 0) map.set(s.id, workers);
  }
  return map;
}

export function SidebarTree({
  sessions,
  selectedPath,
  groupMode = "date",
  collapsedDates,
  onSelectSession,
  onToggleDate,
}: SidebarTreeProps) {
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set());

  const workerMap = useMemo(() => buildWorkerMap(sessions), [sessions]);
  const grouped = useMemo(
    () =>
      groupSessions(
        sessions.filter((session) => !session.is_inline_worker),
        groupMode,
      ),
    [sessions, groupMode],
  );

  const handleToggleGroup = useCallback(
    (e: React.MouseEvent, groupKey: string) => {
      e.stopPropagation();
      onToggleDate(groupKey);
    },
    [onToggleDate],
  );

  const handleToggleWorkers = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setExpandedWorkers((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="sidebar-tree sidebar-tree--empty">
        <span className="sidebar-tree__empty">No sessions</span>
      </div>
    );
  }

  return (
    <div className="sidebar-tree">
      {grouped.map((group) => {
        const collapsed = collapsedDates.has(group.key);
        return (
          <div key={group.key} className="sidebar-tree__group">
            <div
              className="sidebar-tree__group-header"
              title={group.title}
              onClick={(e) => handleToggleGroup(e, group.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onToggleDate(group.key);
              }}
            >
              <span className="sidebar-tree__chevron">{collapsed ? "▶" : "▼"}</span>
              <span className="sidebar-tree__group-label">{group.label}</span>
              <span className="sidebar-tree__count">{group.items.length}</span>
            </div>

            {!collapsed &&
              group.items.map((s) => {
                const isSelected = s.path === selectedPath;
                const workers = workerMap.get(s.id);
                const workersExpanded = expandedWorkers.has(s.id);
                const displayName = sessionDisplayName(s);

                return (
                  <div key={s.path}>
                    <div
                      className={[
                        "sidebar-tree__session",
                        isSelected ? "sidebar-tree__session--selected" : "",
                        s.is_ongoing ? "sidebar-tree__session--ongoing" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => onSelectSession(s)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSelectSession(s);
                      }}
                    >
                      <div className="sidebar-tree__session-row">
                        <span className="sidebar-tree__session-label" title={displayName}>
                          {displayName}
                        </span>
                        {s.is_ongoing && <OngoingDots count={1} />}
                        <span className="sidebar-tree__size">
                          {formatFileSize(s.file_size_bytes)}
                        </span>
                        <span className="sidebar-tree__time">{timeAgo(s.last_activity_time)}</span>
                      </div>
                      {(s.is_external_worker || workers) && (
                        <div className="sidebar-tree__session-meta">
                          {s.is_external_worker && (
                            <span className="sidebar-tree__badge sidebar-tree__badge--external-worker">
                              worker
                            </span>
                          )}
                          {workers && (
                            <button
                              className="sidebar-tree__workers-toggle"
                              onClick={(e) => handleToggleWorkers(e, s.id)}
                            >
                              {workersExpanded ? "▼" : "▶"} {workers.length} workers
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {workers &&
                      workersExpanded &&
                      workers.map((w) => {
                        const wSelected = w.path === selectedPath;
                        const workerDisplayName = sessionDisplayName(w);
                        return (
                          <div
                            key={w.path}
                            className={[
                              "sidebar-tree__session",
                              "sidebar-tree__session--child",
                              wSelected ? "sidebar-tree__session--selected" : "",
                              w.is_ongoing ? "sidebar-tree__session--ongoing" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => onSelectSession(w)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") onSelectSession(w);
                            }}
                          >
                            <div className="sidebar-tree__session-row">
                              <span className="sidebar-tree__badge sidebar-tree__badge--worker">
                                worker
                              </span>
                              <span
                                className="sidebar-tree__session-label"
                                title={workerDisplayName}
                              >
                                {workerDisplayName}
                              </span>
                              {w.is_ongoing && <OngoingDots count={1} />}
                              <span className="sidebar-tree__size">
                                {formatFileSize(w.file_size_bytes)}
                              </span>
                              <span className="sidebar-tree__time">
                                {timeAgo(w.last_activity_time)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
