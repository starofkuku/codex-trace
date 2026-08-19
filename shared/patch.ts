// Parse a Codex `apply_patch` body into per-file, per-hunk structured diffs.
//
// The patch text Codex logs in a custom_tool_call `input` looks like:
//
//   *** Begin Patch
//   *** Update File: path/to/file
//   @@ optional context heading
//    unchanged line   (leading space)
//   -removed line
//   +added line
//   *** End Patch
//
// We honour the patch's own +/-/context classification (rather than re-diffing)
// and reuse `groupRuns` + `segmentize` from diff.ts to add word-level
// highlighting on each paired removed/added run — the same look as the Edit
// diff in claude-code-trace.

import { type DiffLine, groupRuns, type LineOp, segmentize } from "./diff";

export type PatchFileOp = "add" | "update" | "delete";

export interface PatchHunk {
  /** Text after the `@@` marker, if any (empty for the implicit first hunk). */
  header: string;
  lines: DiffLine[];
}

export interface PatchFile {
  path: string;
  op: PatchFileOp;
  /** Destination path when the patch renames/moves the file (`*** Move to:`). */
  movePath: string | null;
  hunks: PatchHunk[];
}

const BEGIN = "*** Begin Patch";
const END = "*** End Patch";
const ADD = "*** Add File: ";
const UPDATE = "*** Update File: ";
const DELETE = "*** Delete File: ";
const MOVE = "*** Move to: ";
const UNIFIED_HUNK_RE = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/;

function hunkStarts(header: string): { oldStart: number; newStart: number } | null {
  const match = `@@ ${header}`.match(UNIFIED_HUNK_RE);
  if (!match) return null;
  return { oldStart: Number(match[1]), newStart: Number(match[2]) };
}

function numberLines(lines: DiffLine[], header: string): DiffLine[] {
  const starts = hunkStarts(header);
  if (!starts) return lines;

  let oldLine = starts.oldStart;
  let newLine = starts.newStart;
  return lines.map((line) => {
    if (line.kind === "context") {
      return { ...line, oldLine: oldLine++, newLine: newLine++ };
    }
    if (line.kind === "removed") {
      return { ...line, oldLine: oldLine++, newLine: null };
    }
    return { ...line, oldLine: null, newLine: newLine++ };
  });
}

function looksLikePatch(patch: string): boolean {
  return (
    patch.includes(BEGIN) || patch.includes(ADD) || patch.includes(UPDATE) || patch.includes(DELETE)
  );
}

// Parse a Codex apply_patch body. Returns null when the text isn't a recognised
// patch (callers then fall back to rendering it as raw text).
export function parseApplyPatch(patch: string): PatchFile[] | null {
  if (!looksLikePatch(patch)) return null;

  const lines = patch.split("\n");
  // Drop a single trailing empty element from a terminal newline so it doesn't
  // surface as a spurious blank context line on the last file.
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  const files: PatchFile[] = [];
  let file: PatchFile | null = null;
  let hunkOps: LineOp[] = [];
  let hunkHeader = "";

  const endHunk = () => {
    if (file && hunkOps.length > 0) {
      const diffLines = segmentize(groupRuns(hunkOps));
      file.hunks.push({ header: hunkHeader, lines: numberLines(diffLines, hunkHeader) });
    }
    hunkOps = [];
    hunkHeader = "";
  };

  const endFile = () => {
    endHunk();
    file = null;
  };

  for (const raw of lines) {
    if (raw.startsWith(BEGIN) || raw.startsWith(END)) continue;

    if (raw.startsWith(ADD) || raw.startsWith(UPDATE) || raw.startsWith(DELETE)) {
      endFile();
      const op: PatchFileOp = raw.startsWith(ADD)
        ? "add"
        : raw.startsWith(UPDATE)
          ? "update"
          : "delete";
      const prefix = op === "add" ? ADD : op === "update" ? UPDATE : DELETE;
      file = { path: raw.slice(prefix.length).trim(), op, movePath: null, hunks: [] };
      files.push(file);
      continue;
    }

    if (raw.startsWith(MOVE)) {
      if (file) file.movePath = raw.slice(MOVE.length).trim();
      continue;
    }

    if (raw.startsWith("@@")) {
      endHunk();
      hunkHeader = raw.slice(2).trim();
      continue;
    }

    if (!file) continue; // stray line outside any file section

    if (raw.startsWith("+")) hunkOps.push({ kind: "added", text: raw.slice(1) });
    else if (raw.startsWith("-")) hunkOps.push({ kind: "removed", text: raw.slice(1) });
    else if (raw.startsWith(" ")) hunkOps.push({ kind: "context", text: raw.slice(1) });
    else hunkOps.push({ kind: "context", text: raw }); // blank/untagged context line
  }
  endFile();

  return files.length > 0 ? files : null;
}

/** Parse the hunk body stored by current Codex `FileChange.unified_diff` events. */
export function parseUnifiedDiff(diff: string): PatchHunk[] {
  const hunks: PatchHunk[] = [];
  let header = "";
  let ops: LineOp[] = [];
  let inHunk = false;

  const finishHunk = () => {
    if (!inHunk) return;
    const lines = segmentize(groupRuns(ops));
    hunks.push({ header, lines: numberLines(lines, header) });
    ops = [];
  };

  for (const raw of diff.split("\n")) {
    if (raw.startsWith("@@")) {
      finishHunk();
      header = raw.slice(2).trim();
      inHunk = true;
      continue;
    }
    if (!inHunk || raw === "\\ No newline at end of file") continue;
    if (raw.startsWith("+")) ops.push({ kind: "added", text: raw.slice(1) });
    else if (raw.startsWith("-")) ops.push({ kind: "removed", text: raw.slice(1) });
    else if (raw.startsWith(" ")) ops.push({ kind: "context", text: raw.slice(1) });
  }
  finishHunk();
  return hunks;
}
