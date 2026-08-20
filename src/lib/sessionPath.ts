/** Return a session file path relative to the Codex sessions directory. */
export function sessionRelativePath(path: string, dateGroup?: string): string {
  const normalized = path.replaceAll("\\", "/");
  const marker = "/sessions/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) return normalized.slice(markerIndex + marker.length);

  const parts = normalized.split("/").filter(Boolean);
  const sessionsIndex = parts.lastIndexOf("sessions");
  if (sessionsIndex >= 0 && sessionsIndex < parts.length - 1) {
    return parts.slice(sessionsIndex + 1).join("/");
  }

  const fileName = parts.at(-1);
  if (dateGroup && fileName) return `${dateGroup.replaceAll("\\", "/")}/${fileName}`;
  return fileName ?? normalized;
}
