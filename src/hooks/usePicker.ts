import { useState, useEffect, useCallback } from "react";
import { invoke } from "../lib/invoke";
import type { CodexSessionInfo, SessionActivityUpdate, SettingsResponse } from "../../shared/types";
import { filterSessions, isPrimarySession, type SessionFilter } from "../lib/sessionFilter";
import { sessionDisplayName } from "../lib/sessionDisplay";
import { useTauriEvent } from "./useTauriEvent";

interface PickerState {
  sessions: CodexSessionInfo[];
  loading: boolean;
  searchQuery: string;
  sessionsDir: string;
  sessionFilter: SessionFilter;
}

export function usePicker() {
  const [state, setState] = useState<PickerState>({
    sessions: [],
    loading: false,
    searchQuery: "",
    sessionsDir: "",
    sessionFilter: "all",
  });

  const discoverSessions = useCallback(async (sessionsDir: string) => {
    if (!sessionsDir) return;
    setState((prev) => ({ ...prev, loading: true, sessionsDir }));
    try {
      const sessions = await invoke<CodexSessionInfo[]>("list_sessions", { sessionsDir });
      setState((prev) => ({ ...prev, sessions, loading: false }));
      try {
        await invoke<void>("watch_picker", { sessionsDir });
      } catch {
        // watcher is optional
      }
    } catch (err) {
      console.error("Failed to discover sessions:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setSessionFilter = useCallback((sessionFilter: SessionFilter) => {
    setState((prev) => ({ ...prev, sessionFilter }));
  }, []);

  const updateSessionActivity = useCallback(
    (
      path: string,
      ongoing: boolean,
      fileSizeBytes?: number,
      lastActivityTime?: string,
      lastUserMessage?: string | null,
    ) => {
      setState((prev) => {
        const idx = prev.sessions.findIndex((s) => s.path === path);
        if (idx === -1) return prev;
        const current = prev.sessions[idx];
        if (
          current.is_ongoing === ongoing &&
          (fileSizeBytes === undefined || current.file_size_bytes === fileSizeBytes) &&
          (lastActivityTime === undefined || current.last_activity_time === lastActivityTime) &&
          (lastUserMessage === undefined || current.last_user_message === lastUserMessage)
        ) {
          return prev;
        }
        const sessions = [...prev.sessions];
        sessions[idx] = {
          ...current,
          is_ongoing: ongoing,
          ...(lastActivityTime === undefined ? {} : { last_activity_time: lastActivityTime }),
          ...(fileSizeBytes === undefined ? {} : { file_size_bytes: fileSizeBytes }),
          ...(lastUserMessage === undefined ? {} : { last_user_message: lastUserMessage }),
        };
        return { ...prev, sessions };
      });
    },
    [],
  );

  const updateSessionOngoing = useCallback(
    (path: string, ongoing: boolean) => updateSessionActivity(path, ongoing),
    [updateSessionActivity],
  );

  useTauriEvent<SessionActivityUpdate>("session-activity", (update) => {
    updateSessionActivity(
      update.path,
      update.is_ongoing,
      update.file_size_bytes,
      update.last_activity_time,
      update.last_user_message,
    );
  });

  // Structural changes carry no session data. Re-fetch only when a session is added or removed;
  // ordinary appends arrive through the per-session activity event above.
  useTauriEvent("picker-refresh", () => {
    setState((prev) => {
      if (!prev.sessionsDir) return prev;
      invoke<CodexSessionInfo[]>("list_sessions", { sessionsDir: prev.sessionsDir })
        .then((sessions) => setState((s) => ({ ...s, sessions })))
        .catch(() => {});
      return prev;
    });
  });

  useEffect(() => {
    return () => {
      invoke<void>("unwatch_picker").catch(() => {});
    };
  }, []);

  const visibleSessions = filterSessions(
    state.sessions.filter(isPrimarySession),
    state.sessionFilter,
  );
  const filteredSessions = state.searchQuery
    ? visibleSessions.filter(
        (s) =>
          sessionDisplayName(s).toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          (s.cwd ?? "").toLowerCase().includes(state.searchQuery.toLowerCase()),
      )
    : visibleSessions;

  return {
    sessions: filteredSessions,
    allSessions: state.sessions,
    loading: state.loading,
    searchQuery: state.searchQuery,
    sessionsDir: state.sessionsDir,
    sessionFilter: state.sessionFilter,
    setSearchQuery,
    setSessionFilter,
    discoverSessions,
    updateSessionOngoing,
  };
}

export async function resolveSessionsDir(): Promise<string> {
  const settings = await invoke<SettingsResponse>("get_settings");
  return settings.sessions_dir ?? settings.default_dir;
}
