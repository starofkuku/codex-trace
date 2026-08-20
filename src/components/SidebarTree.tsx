import { useCallback, useMemo } from "react";
import type { CodexSessionInfo } from "../../shared/types";
import { formatFileSize, timeAgo } from "../../shared/format";
import { sessionDisplayName } from "../lib/sessionDisplay";
import { isPrimarySession } from "../lib/sessionFilter";
import {
  groupSessions,
  type SessionGroupMode,
  type SessionSortOrder,
} from "../lib/sessionGrouping";
import { OngoingDots } from "./OngoingDots";

interface SidebarTreeProps {
  sessions: CodexSessionInfo[];
  selectedPath: string | null;
  groupMode?: SessionGroupMode;
  sortOrder?: SessionSortOrder;
  collapsedDates: Set<string>;
  onSelectSession: (info: CodexSessionInfo) => void;
  onToggleDate: (groupKey: string) => void;
}

export function SidebarTree({
  sessions,
  selectedPath,
  groupMode = "date",
  sortOrder = "newest",
  collapsedDates,
  onSelectSession,
  onToggleDate,
}: SidebarTreeProps) {
  const primarySessions = useMemo(() => sessions.filter(isPrimarySession), [sessions]);
  const grouped = useMemo(
    () => groupSessions(primarySessions, groupMode, sortOrder),
    [primarySessions, groupMode, sortOrder],
  );

  const handleToggleGroup = useCallback(
    (e: React.MouseEvent, groupKey: string) => {
      e.stopPropagation();
      onToggleDate(groupKey);
    },
    [onToggleDate],
  );

  if (primarySessions.length === 0) {
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
                const displayName = sessionDisplayName(s);

                return (
                  <div
                    key={s.path}
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
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
