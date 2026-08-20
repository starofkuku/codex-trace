import { VscCalendar, VscFolder } from "react-icons/vsc";
import type { SessionGroupMode } from "../lib/sessionGrouping";

interface SessionGroupToggleProps {
  mode: SessionGroupMode;
  compact?: boolean;
  onChange: (mode: SessionGroupMode) => void;
}

export function SessionGroupToggle({ mode, compact = false, onChange }: SessionGroupToggleProps) {
  return (
    <div
      className={`session-group-toggle${compact ? " session-group-toggle--compact" : ""}`}
      role="group"
      aria-label="Session grouping"
    >
      <button
        type="button"
        className={
          mode === "directory"
            ? "session-group-toggle__button session-group-toggle__button--active"
            : "session-group-toggle__button"
        }
        aria-label="Group by directory"
        aria-pressed={mode === "directory"}
        title="Group by directory"
        onClick={() => onChange("directory")}
      >
        <VscFolder />
        {!compact && <span>Directory</span>}
      </button>
      <button
        type="button"
        className={
          mode === "date"
            ? "session-group-toggle__button session-group-toggle__button--active"
            : "session-group-toggle__button"
        }
        aria-label="Group by date"
        aria-pressed={mode === "date"}
        title="Group by date"
        onClick={() => onChange("date")}
      >
        <VscCalendar />
        {!compact && <span>Date</span>}
      </button>
    </div>
  );
}
