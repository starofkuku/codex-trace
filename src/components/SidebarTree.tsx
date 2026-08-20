import { useCallback, useMemo, useState } from "react";
import type { CodexSessionInfo } from "../../shared/types";
import { formatFileSize, timeAgo } from "../../shared/format";
import { copyText } from "../lib/copyText";
import { sessionDisplayName } from "../lib/sessionDisplay";
import { isPrimarySession } from "../lib/sessionFilter";
import { sessionRelativePath } from "../lib/sessionPath";
import {
  groupSessions,
  type SessionGroupMode,
  type SessionSortOrder,
} from "../lib/sessionGrouping";
import { OngoingDots } from "./OngoingDots";
import { SubagentMarker } from "./SubagentMarker";
import { VscCheck, VscCopy, VscFile } from "react-icons/vsc";

const EMPTY_SESSION_IDS: ReadonlySet<string> = new Set();

interface SidebarTreeProps {
  sessions: CodexSessionInfo[];
  selectedPath: string | null;
  groupMode?: SessionGroupMode;
  sortOrder?: SessionSortOrder;
  selectionMode?: boolean;
  selectedSessionIds?: ReadonlySet<string>;
  collapsedDates: Set<string>;
  onSelectSession: (info: CodexSessionInfo) => void;
  onToggleSessionSelection?: (info: CodexSessionInfo) => void;
  onToggleDate: (groupKey: string) => void;
}

export function SidebarTree({
  sessions,
  selectedPath,
  groupMode = "date",
  sortOrder = "newest",
  selectionMode = false,
  selectedSessionIds = EMPTY_SESSION_IDS,
  collapsedDates,
  onSelectSession,
  onToggleSessionSelection,
  onToggleDate,
}: SidebarTreeProps) {
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
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

  const handleCopy = useCallback(async (session: CodexSessionInfo, target: "id" | "path") => {
    const copyKey = `${session.path}:${target}`;
    const value =
      target === "id" ? session.id : sessionRelativePath(session.path, session.date_group);
    try {
      await copyText(value);
      setCopiedTarget(copyKey);
      window.setTimeout(
        () => setCopiedTarget((current) => (current === copyKey ? null : current)),
        1500,
      );
    } catch {
      setCopiedTarget(null);
    }
  }, []);

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
                const isChecked = selectedSessionIds.has(s.id);
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
                    onClick={() =>
                      selectionMode ? onToggleSessionSelection?.(s) : onSelectSession(s)
                    }
                    role={selectionMode ? undefined : "button"}
                    tabIndex={selectionMode ? undefined : 0}
                    onKeyDown={(e) => {
                      if (!selectionMode && e.key === "Enter") onSelectSession(s);
                    }}
                  >
                    <div className="sidebar-tree__session-row">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          className="sidebar-tree__session-checkbox"
                          checked={isChecked}
                          aria-label={`Select session ${s.id}`}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => onToggleSessionSelection?.(s)}
                        />
                      )}
                      <span className="sidebar-tree__session-label" title={displayName}>
                        {displayName}
                      </span>
                      <SubagentMarker count={s.spawned_worker_ids.length} />
                      {s.is_ongoing && <OngoingDots count={1} />}
                      <span className="sidebar-tree__size">
                        {formatFileSize(s.file_size_bytes)}
                      </span>
                      <span className="sidebar-tree__time">{timeAgo(s.last_activity_time)}</span>
                      {!selectionMode && (
                        <>
                          <button
                            type="button"
                            className={`sidebar-tree__copy-button${copiedTarget === `${s.path}:id` ? " sidebar-tree__copy-button--copied" : ""}`}
                            aria-label={
                              copiedTarget === `${s.path}:id`
                                ? "Copied session ID"
                                : "Copy session ID"
                            }
                            title={
                              copiedTarget === `${s.path}:id`
                                ? "Copied session ID"
                                : "Copy session ID"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCopy(s, "id");
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            {copiedTarget === `${s.path}:id` ? <VscCheck /> : <VscCopy />}
                          </button>
                          <button
                            type="button"
                            className={`sidebar-tree__copy-button${copiedTarget === `${s.path}:path` ? " sidebar-tree__copy-button--copied" : ""}`}
                            aria-label={
                              copiedTarget === `${s.path}:path`
                                ? "Copied session path"
                                : "Copy session path"
                            }
                            title={
                              copiedTarget === `${s.path}:path`
                                ? "Copied session path"
                                : "Copy session path"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCopy(s, "path");
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            {copiedTarget === `${s.path}:path` ? <VscCheck /> : <VscFile />}
                          </button>
                        </>
                      )}
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
