import {
  PERSIST_VERSION,
  mergeVisionState,
  persistedSlice,
  useVision,
} from "../store";
import type { PersistedVision } from "../store";

/** Marks a file as ours, so we can refuse someone's unrelated .json kindly. */
export const BACKUP_KIND = "vision-backup";

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  /** Store schema version the file was written against. */
  version: number;
  exportedAt: string;
  data: PersistedVision;
}

/** What a file holds / what a restore landed — used for plain-language confirmation. */
export interface BackupCounts {
  boards: number;
  goals: number;
  journal: number;
  affirmations: number;
}

export function countsOf(data: PersistedVision): BackupCounts {
  return {
    boards: data.boards?.length || 0,
    goals: data.goals?.length || 0,
    journal: data.journal?.length || 0,
    affirmations: data.affirmations?.length || 0,
  };
}

/** "3 boards, 12 goals, 40 journal entries, 9 affirmations" */
export function describeCounts(c: BackupCounts): string {
  const plural = (n: number, one: string, many = `${one}s`) =>
    `${n} ${n === 1 ? one : many}`;
  return [
    plural(c.boards, "board"),
    plural(c.goals, "goal"),
    plural(c.journal, "journal entry", "journal entries"),
    plural(c.affirmations, "affirmation"),
  ].join(", ");
}

export function buildBackup(): BackupFile {
  const data = persistedSlice(useVision.getState());
  return {
    kind: BACKUP_KIND,
    version: PERSIST_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      ...data,
      // A backup gets emailed around and synced to clouds — the key stays on the device.
      museSettings: { ...data.museSettings, apiKey: "" },
    },
  };
}

export function backupFilename(at = new Date()): string {
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, "0"),
    String(at.getDate()).padStart(2, "0"),
  ].join("-");
  return `vision-backup-${stamp}.json`;
}

/** Hands the file to the browser. Returns what was written, for the status line. */
export function downloadBackup(): { name: string; bytes: number } {
  const json = JSON.stringify(buildBackup(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const name = backupFilename();

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari needs the URL alive until the click is handled.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { name, bytes: blob.size };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Throws with a sentence worth showing the user. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn’t readable — it doesn’t look like JSON.");
  }
  if (!raw || typeof raw !== "object") {
    throw new Error("That file is empty or not a vision backup.");
  }
  const file = raw as Partial<BackupFile>;
  if (file.kind !== BACKUP_KIND) {
    throw new Error("That’s not a vision backup file.");
  }
  if (!file.data || typeof file.data !== "object") {
    throw new Error("That backup is missing its data.");
  }
  if (typeof file.version === "number" && file.version > PERSIST_VERSION) {
    throw new Error(
      "That backup was saved by a newer version of vision. Update the app first.",
    );
  }
  const d = file.data as Partial<PersistedVision>;
  const hasAnything =
    Array.isArray(d.boards) ||
    Array.isArray(d.goals) ||
    Array.isArray(d.journal) ||
    Array.isArray(d.affirmations);
  if (!hasAnything) {
    throw new Error("That backup has no boards, goals, or journal in it.");
  }
  return file as BackupFile;
}

/**
 * Replace everything with the file's contents. Caller confirms first — this is
 * not undoable. Returns the counts that actually landed, not what the file claimed.
 */
export function restoreBackup(file: BackupFile): BackupCounts {
  const current = useVision.getState();
  const merged = mergeVisionState(file.data, current);
  useVision.setState({
    ...merged,
    museSettings: {
      ...merged.museSettings,
      // The file never carries a key; keep the one already on this device.
      apiKey: current.museSettings.apiKey,
    },
  });
  return countsOf(persistedSlice(useVision.getState()));
}
