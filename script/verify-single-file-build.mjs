import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve("dist");
const files = await readdir(distDir, { recursive: true, withFileTypes: true });
const outputFiles = files.filter((entry) => entry.isFile());

if (outputFiles.length !== 1 || outputFiles[0].name !== "index.html") {
  const names = outputFiles.map((entry) => entry.name).join(", ") || "none";
  throw new Error(`Expected only dist/index.html, found: ${names}`);
}

const html = await readFile(resolve(distDir, "index.html"), "utf8");
if (!html.includes("<style") || !html.includes("<script")) {
  throw new Error("dist/index.html does not contain inlined CSS and JavaScript");
}

if (/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel=["']stylesheet["']/i.test(html)) {
  throw new Error("dist/index.html still references external JavaScript or CSS");
}
