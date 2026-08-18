use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::broadcast;

use crate::parser::discover::CodexSessionInfo;
use crate::parser::session::{
    page_session, CodexSession, IncrementalSession, SessionPageDirection, SessionRefresh,
};
use crate::settings::Settings;
use crate::watcher::WatcherHandle;

/// A Server-Sent Event destined for browser clients.
#[derive(Clone, Debug)]
pub struct SseEvent {
    pub event: String,
    pub data: String,
}

struct SessionsCache {
    dir: String,
    cached_at: Instant,
    sessions: Vec<CodexSessionInfo>,
}

const SESSIONS_CACHE_TTL: Duration = Duration::from_secs(2);
const MAX_PARSED_SESSION_CACHE_ENTRIES: usize = 8;
const MAX_PARSED_SESSION_CACHE_BYTES: u64 = 256 * 1024 * 1024;

pub struct AppState {
    pub session_watcher: Mutex<Option<WatcherHandle>>,
    pub picker_watcher: Mutex<Option<WatcherHandle>>,
    pub settings: Mutex<Settings>,
    pub watched_session_ongoing: Mutex<Option<(String, bool)>>,
    pub event_tx: broadcast::Sender<SseEvent>,
    sessions_cache: Mutex<Option<SessionsCache>>,
    parsed_sessions: Mutex<HashMap<String, Arc<Mutex<IncrementalSession>>>>,
}

impl AppState {
    pub fn new() -> Self {
        let (event_tx, _) = broadcast::channel(64);
        Self {
            session_watcher: Mutex::new(None),
            picker_watcher: Mutex::new(None),
            settings: Mutex::new(crate::settings::load_settings()),
            watched_session_ongoing: Mutex::new(None),
            event_tx,
            sessions_cache: Mutex::new(None),
            parsed_sessions: Mutex::new(HashMap::new()),
        }
    }

    fn parsed_session(&self, path: &str) -> Result<Arc<Mutex<IncrementalSession>>, String> {
        if path.is_empty() {
            return Err(crate::commands::session::NO_SESSION_PATH_PROVIDED.to_string());
        }

        {
            let cache = self.parsed_sessions.lock().map_err(|e| e.to_string())?;
            if let Some(entry) = cache.get(path) {
                return Ok(entry.clone());
            }
        }

        let parsed = Arc::new(Mutex::new(IncrementalSession::load(std::path::Path::new(
            path,
        ))?));
        let mut cache = self.parsed_sessions.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = cache.get(path) {
            return Ok(entry.clone());
        }
        let parsed_size = parsed
            .lock()
            .map(|session| session.source_size_bytes())
            .unwrap_or(0);
        let mut cached_size: u64 = cache
            .values()
            .filter_map(|entry| entry.lock().ok().map(|session| session.source_size_bytes()))
            .sum();
        while (cache.len() >= MAX_PARSED_SESSION_CACHE_ENTRIES
            || cached_size.saturating_add(parsed_size) > MAX_PARSED_SESSION_CACHE_BYTES)
            && !cache.is_empty()
        {
            if let Some(oldest_key) = cache.keys().next().cloned() {
                if let Some(oldest) = cache.remove(&oldest_key) {
                    cached_size = cached_size.saturating_sub(
                        oldest
                            .lock()
                            .map(|session| session.source_size_bytes())
                            .unwrap_or(0),
                    );
                }
            } else {
                break;
            }
        }
        cache.insert(path.to_string(), parsed.clone());
        Ok(parsed)
    }

    /// Load a session from the shared parsed-session cache and return the requested page.
    pub fn load_session_page(
        &self,
        path: &str,
        direction: SessionPageDirection,
        cursor: Option<usize>,
        max_bytes: Option<usize>,
    ) -> Result<CodexSession, String> {
        let entry = self.parsed_session(path)?;
        let mut session = entry.lock().map_err(|e| e.to_string())?;
        let _ = session.refresh()?;
        page_session(
            session.session(),
            direction,
            cursor,
            max_bytes,
            session.source_size_bytes(),
        )
    }

    /// Return the current complete snapshot for watcher setup and Tauri callers.
    pub fn load_session_snapshot(&self, path: &str) -> Result<CodexSession, String> {
        let entry = self.parsed_session(path)?;
        let mut session = entry.lock().map_err(|e| e.to_string())?;
        let _ = session.refresh()?;
        Ok(session.session().clone())
    }

    /// Refresh a cached parser and return only the changed data for the live watcher.
    pub fn refresh_session(&self, path: &str) -> Result<SessionRefresh, String> {
        let entry = self.parsed_session(path)?;
        let mut session = entry.lock().map_err(|e| e.to_string())?;
        session.refresh()
    }

    pub fn stop_session_watcher(&self) -> Result<(), String> {
        let mut guard = self.session_watcher.lock().map_err(|e| e.to_string())?;
        if let Some(handle) = guard.take() {
            handle.stop();
        }
        Ok(())
    }

    pub fn set_session_watcher(&self, handle: WatcherHandle) -> Result<(), String> {
        let mut guard = self.session_watcher.lock().map_err(|e| e.to_string())?;
        *guard = Some(handle);
        Ok(())
    }

    pub fn stop_picker_watcher(&self) -> Result<(), String> {
        let mut guard = self.picker_watcher.lock().map_err(|e| e.to_string())?;
        if let Some(handle) = guard.take() {
            handle.stop();
        }
        Ok(())
    }

    pub fn set_picker_watcher(&self, handle: WatcherHandle) -> Result<(), String> {
        let mut guard = self.picker_watcher.lock().map_err(|e| e.to_string())?;
        *guard = Some(handle);
        Ok(())
    }

    pub fn set_watched_ongoing(&self, path: String, ongoing: bool) {
        if let Ok(mut guard) = self.watched_session_ongoing.lock() {
            *guard = Some((path, ongoing));
        }
    }

    pub fn clear_watched_ongoing(&self) {
        if let Ok(mut guard) = self.watched_session_ongoing.lock() {
            *guard = None;
        }
    }

    pub fn apply_watched_ongoing(&self, sessions: &mut [CodexSessionInfo]) {
        let guard = match self.watched_session_ongoing.lock() {
            Ok(g) => g,
            Err(_) => return,
        };
        if let Some((ref path, ongoing)) = *guard {
            if let Some(s) = sessions.iter_mut().find(|s| s.path == *path) {
                s.is_ongoing = ongoing;
            }
        }
    }

    /// Discover sessions for `dir`, returning a cached result if fresh enough.
    /// Multiple concurrent callers within the TTL window share one disk scan.
    pub fn discover_sessions_cached(&self, dir: &str) -> Result<Vec<CodexSessionInfo>, String> {
        let mut cache = self.sessions_cache.lock().map_err(|e| e.to_string())?;
        if let Some(ref c) = *cache {
            if c.dir == dir && c.cached_at.elapsed() < SESSIONS_CACHE_TTL {
                return Ok(c.sessions.clone());
            }
        }
        let path = std::path::Path::new(dir);
        let sessions = crate::parser::discover::discover_sessions(path)?;
        *cache = Some(SessionsCache {
            dir: dir.to_string(),
            cached_at: Instant::now(),
            sessions: sessions.clone(),
        });
        Ok(sessions)
    }

    pub fn broadcast(&self, event: &str, data: &str) {
        let _ = self.event_tx.send(SseEvent {
            event: event.to_string(),
            data: data.to_string(),
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_state() -> AppState {
        AppState::new()
    }

    #[test]
    fn discover_sessions_cached_returns_empty_for_nonexistent_dir() {
        // discover_sessions returns Ok(empty) for nonexistent dirs (not an error).
        let state = make_state();
        let result = state.discover_sessions_cached("/nonexistent/path/that/does/not/exist");
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn discover_sessions_cached_hits_cache_on_second_call() {
        let state = make_state();
        // Use a real empty temp dir so the first call succeeds and populates cache
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().to_str().unwrap();

        let first = state.discover_sessions_cached(path).unwrap();
        assert!(first.is_empty());

        // Prime the cache with a fake entry by directly writing to the cache lock
        {
            let mut cache = state.sessions_cache.lock().unwrap();
            *cache = Some(SessionsCache {
                dir: path.to_string(),
                cached_at: Instant::now(),
                sessions: vec![CodexSessionInfo {
                    id: "cached-session".to_string(),
                    path: "/fake/path.jsonl".to_string(),
                    cwd: None,
                    git_branch: None,
                    originator: None,
                    model: None,
                    cli_version: None,
                    thread_name: None,
                    turn_count: 0,
                    start_time: String::new(),
                    end_time: None,
                    total_tokens: None,
                    is_ongoing: false,
                    is_external_worker: false,
                    is_inline_worker: false,
                    is_headless: false,
                    is_archived: false,
                    worker_nickname: None,
                    worker_role: None,
                    spawned_worker_ids: vec![],
                    date_group: String::new(),
                    ai_title: None,
                    approval_mode: None,
                    history_base_thread_id: None,
                    file_size_bytes: 0,
                }],
            });
        }

        // Second call must return the cached fake entry, not re-scan the dir
        let second = state.discover_sessions_cached(path).unwrap();
        assert_eq!(second.len(), 1);
        assert_eq!(second[0].id, "cached-session");
    }

    #[test]
    fn discover_sessions_cached_invalidates_cache_for_different_dir() {
        let state = make_state();
        let dir_a = tempfile::tempdir().unwrap();
        let dir_b = tempfile::tempdir().unwrap();

        // Populate cache for dir_a with a fake entry
        {
            let mut cache = state.sessions_cache.lock().unwrap();
            *cache = Some(SessionsCache {
                dir: dir_a.path().to_str().unwrap().to_string(),
                cached_at: Instant::now(),
                sessions: vec![CodexSessionInfo {
                    id: "dir-a-session".to_string(),
                    path: "/fake/a.jsonl".to_string(),
                    cwd: None,
                    git_branch: None,
                    originator: None,
                    model: None,
                    cli_version: None,
                    thread_name: None,
                    turn_count: 0,
                    start_time: String::new(),
                    end_time: None,
                    total_tokens: None,
                    is_ongoing: false,
                    is_external_worker: false,
                    is_inline_worker: false,
                    is_headless: false,
                    is_archived: false,
                    worker_nickname: None,
                    worker_role: None,
                    spawned_worker_ids: vec![],
                    date_group: String::new(),
                    ai_title: None,
                    approval_mode: None,
                    history_base_thread_id: None,
                    file_size_bytes: 0,
                }],
            });
        }

        // Requesting dir_b must bypass the cache and return the real (empty) scan
        let result = state
            .discover_sessions_cached(dir_b.path().to_str().unwrap())
            .unwrap();
        assert!(
            result.is_empty(),
            "different dir must not return dir_a cached data"
        );
    }
}
