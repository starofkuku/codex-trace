export const FRONTEND_VERSION = CODEX_TRACE_VERSION;

export function versionStatus(backendVersion?: string): "current" | "mismatch" | "unknown" {
  if (!backendVersion) return "unknown";
  return backendVersion === FRONTEND_VERSION ? "current" : "mismatch";
}
