import { SpawnIcon } from "./Icons";

interface SubagentMarkerProps {
  count?: number;
  active?: boolean;
}

export function SubagentMarker({ count = 0, active = false }: SubagentMarkerProps) {
  if (count < 1 && !active) return null;

  const label = count > 0 ? `Uses ${count} subagent${count === 1 ? "" : "s"}` : "Uses subagents";
  return (
    <span className="subagent-marker" aria-label={label} title={label}>
      <SpawnIcon />
    </span>
  );
}
