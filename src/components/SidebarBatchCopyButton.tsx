import { VscChecklist, VscCopy } from "react-icons/vsc";

interface SidebarBatchCopyButtonProps {
  active: boolean;
  selectedCount: number;
  onClick: () => void;
}

export function SidebarBatchCopyButton({
  active,
  selectedCount,
  onClick,
}: SidebarBatchCopyButtonProps) {
  const label = active
    ? selectedCount > 0
      ? `Copy ${selectedCount} selected session ID${selectedCount === 1 ? "" : "s"}`
      : "Cancel session selection"
    : "Select session IDs to copy";

  return (
    <button
      type="button"
      className="sidebar-batch-copy-button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {active ? <VscCopy /> : <VscChecklist />}
    </button>
  );
}
