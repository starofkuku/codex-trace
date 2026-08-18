import { VscChevronLeft, VscChevronRight } from "react-icons/vsc";

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const Icon = collapsed ? VscChevronRight : VscChevronLeft;

  return (
    <button
      type="button"
      className="app__sidebar-toggle"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
