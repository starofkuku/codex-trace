import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsModal } from "./SettingsModal";
import { FRONTEND_VERSION } from "../lib/version";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/invoke", () => ({ invoke: invokeMock }));

const settings = {
  sessions_dir: null,
  default_dir: "/home/app/.codex/sessions",
  backend_version: FRONTEND_VERSION,
};

function renderSettings(onFrontendUpdated = vi.fn()) {
  render(
    <SettingsModal onClose={vi.fn()} onSaved={vi.fn()} onFrontendUpdated={onFrontendUpdated} />,
  );
}

describe("SettingsModal", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValueOnce(settings);
  });

  it("shows matching frontend and backend versions", async () => {
    renderSettings();

    expect(await screen.findByText(`Frontend v${FRONTEND_VERSION}`)).toBeInTheDocument();
    expect(screen.getByText(`Backend v${FRONTEND_VERSION}`)).toBeInTheDocument();
    expect(screen.queryByText("Update required")).not.toBeInTheDocument();
  });

  it("marks a frontend and backend version mismatch", async () => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValueOnce({ ...settings, backend_version: "0.1.0" });
    renderSettings();

    expect(await screen.findByText("Backend v0.1.0")).toBeInTheDocument();
    expect(screen.getByText("Update required")).toBeInTheDocument();
  });

  it("updates the frontend and reloads after the request succeeds", async () => {
    const onFrontendUpdated = vi.fn();
    invokeMock.mockResolvedValueOnce({ updated: true, bytes: 1024 });
    renderSettings(onFrontendUpdated);
    await screen.findByDisplayValue(settings.default_dir);

    fireEvent.click(screen.getByRole("button", { name: "Update Frontend" }));

    await waitFor(() => expect(invokeMock).toHaveBeenLastCalledWith("update_frontend"));
    expect(onFrontendUpdated).toHaveBeenCalledOnce();
  });

  it("keeps the current page and displays an update error", async () => {
    const onFrontendUpdated = vi.fn();
    invokeMock.mockRejectedValueOnce(new Error("download failed"));
    renderSettings(onFrontendUpdated);
    await screen.findByDisplayValue(settings.default_dir);

    fireEvent.click(screen.getByRole("button", { name: "Update Frontend" }));

    expect(await screen.findByText("Error: download failed")).toBeInTheDocument();
    expect(onFrontendUpdated).not.toHaveBeenCalled();
  });
});
