import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FRONTEND_VERSION } from "../lib/version";
import { KeybindBar } from "./KeybindBar";

describe("KeybindBar", () => {
  it("always shows the frontend version", () => {
    render(<KeybindBar view="picker" />);

    expect(screen.getByTitle("Frontend version")).toHaveTextContent(`v${FRONTEND_VERSION}`);
  });
});
