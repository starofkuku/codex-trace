import type { CodexSessionInfo } from "../../shared/types";

export function sessionDisplayName(session: CodexSessionInfo): string {
  if (session.is_inline_worker || session.is_external_worker) {
    const shortId = session.id.slice(0, 8);
    if (session.worker_nickname) return `${session.worker_nickname} (${shortId})`;
    if (session.worker_role) return `${session.worker_role} ${shortId}`;
    return `worker ${shortId}`;
  }

  if (session.thread_name?.trim()) return session.thread_name.trim();
  if (session.last_user_message?.trim()) return session.last_user_message.trim();
  return session.id.slice(0, 8);
}
