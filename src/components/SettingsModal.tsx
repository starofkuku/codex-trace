import { useState, useEffect, useCallback } from "react";
import { invoke } from "../lib/invoke";
import { PopoutModal } from "./PopoutModal";
import type { SettingsResponse } from "../../shared/types";
import { RefreshIcon } from "./Icons";
import { isTauri } from "../lib/isTauri";
import { FRONTEND_VERSION, versionStatus } from "../lib/version";

interface SettingsModalProps {
  onClose: () => void;
  onSaved: (dir: string) => void;
  onFrontendUpdated: () => void;
}

export function SettingsModal({ onClose, onSaved, onFrontendUpdated }: SettingsModalProps) {
  const [sessionsDir, setSessionsDir] = useState("");
  const [defaultDir, setDefaultDir] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingFrontend, setUpdatingFrontend] = useState(false);
  const [backendVersion, setBackendVersion] = useState<string>();

  useEffect(() => {
    invoke<SettingsResponse>("get_settings")
      .then((res) => {
        setDefaultDir(res.default_dir);
        setSessionsDir(res.sessions_dir ?? res.default_dir);
        setBackendVersion(res.backend_version);
      })
      .catch(console.error);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const trimmed = sessionsDir.trim();
      await invoke<SettingsResponse>("set_sessions_dir", { path: trimmed || null });
      onSaved(trimmed || defaultDir);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, [sessionsDir, defaultDir, onSaved, onClose]);

  const handleReset = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const res = await invoke<SettingsResponse>("set_sessions_dir", { path: null });
      setSessionsDir(res.default_dir);
      onSaved(res.default_dir);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, [onSaved, onClose]);

  const handleFrontendUpdate = useCallback(async () => {
    setUpdatingFrontend(true);
    setError("");
    try {
      await invoke("update_frontend");
      onFrontendUpdated();
    } catch (err) {
      setError(String(err));
    } finally {
      setUpdatingFrontend(false);
    }
  }, [onFrontendUpdated]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  const currentVersionStatus = versionStatus(backendVersion);

  return (
    <PopoutModal
      onClose={onClose}
      header={<span className="settings-modal__title">Settings</span>}
      initialWidth={520}
      initialHeight={isTauri ? 280 : 340}
    >
      <div className="settings-modal">
        <label className="settings-modal__label" htmlFor="sessions-dir">
          Sessions Directory
        </label>
        <input
          id="sessions-dir"
          className="settings-modal__input"
          type="text"
          value={sessionsDir}
          onChange={(e) => {
            setSessionsDir(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={defaultDir}
          spellCheck={false}
          autoFocus
        />
        <p className="settings-modal__hint">Default: {defaultDir}</p>
        {!isTauri && (
          <div className="settings-modal__frontend">
            <span className="settings-modal__label">Web Frontend</span>
            <button
              type="button"
              className="settings-modal__btn settings-modal__btn--update"
              onClick={handleFrontendUpdate}
              disabled={saving || updatingFrontend}
            >
              <RefreshIcon />
              {updatingFrontend ? "Updating..." : "Update Frontend"}
            </button>
          </div>
        )}
        <div className="settings-modal__version">
          <span className="settings-modal__label">Version</span>
          <div className="settings-modal__version-values">
            <span>Frontend v{FRONTEND_VERSION}</span>
            <span>Backend {backendVersion ? `v${backendVersion}` : "unknown"}</span>
            {currentVersionStatus === "mismatch" && (
              <span className="settings-modal__version-warning">Update required</span>
            )}
            {currentVersionStatus === "unknown" && (
              <span className="settings-modal__version-warning">Backend version unavailable</span>
            )}
          </div>
        </div>
        {error && <p className="settings-modal__error">{error}</p>}
        <div className="settings-modal__actions">
          <button
            className="settings-modal__btn settings-modal__btn--secondary"
            onClick={handleReset}
            disabled={saving || updatingFrontend}
          >
            Reset to Default
          </button>
          <button
            className="settings-modal__btn settings-modal__btn--primary"
            onClick={handleSave}
            disabled={saving || updatingFrontend}
          >
            Save
          </button>
        </div>
      </div>
    </PopoutModal>
  );
}
