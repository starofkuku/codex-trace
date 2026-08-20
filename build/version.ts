import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readAppVersion(): string {
  const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
    version: string;
  };
  return packageJson.version;
}
