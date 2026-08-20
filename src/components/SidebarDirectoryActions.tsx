import { VscArrowDown, VscArrowUp, VscFoldDown, VscFoldUp } from "react-icons/vsc";
import type { SessionSortOrder } from "../lib/sessionGrouping";

interface SidebarDirectoryActionsProps {
  sortOrder: SessionSortOrder;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleSort: () => void;
}

export function SidebarDirectoryActions({
  sortOrder,
  onExpandAll,
  onCollapseAll,
  onToggleSort,
}: SidebarDirectoryActionsProps) {
  const sortLabel =
    sortOrder === "newest"
      ? "Newest activity first; switch to oldest first"
      : "Oldest activity first; switch to newest first";

  return (
    <div className="sidebar-directory-actions" role="group" aria-label="Directory actions">
      <button
        type="button"
        className="sidebar-directory-actions__button"
        aria-label="Expand all directories"
        title="Expand all directories"
        onClick={onExpandAll}
      >
        <VscFoldDown />
      </button>
      <button
        type="button"
        className="sidebar-directory-actions__button"
        aria-label="Collapse all directories"
        title="Collapse all directories"
        onClick={onCollapseAll}
      >
        <VscFoldUp />
      </button>
      <button
        type="button"
        className="sidebar-directory-actions__button"
        aria-label={sortLabel}
        title={sortLabel}
        onClick={onToggleSort}
      >
        {sortOrder === "newest" ? <VscArrowDown /> : <VscArrowUp />}
      </button>
    </div>
  );
}
