import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Affirmation,
  BoardItem,
  BoardThemeId,
  Goal,
  JournalEntry,
  TabId,
  UserProfile,
  VisionBoard,
  ZodiacSign,
} from "./types";
import { STARTER_AFFIRMATIONS } from "./lib/affirmations";
import { signFromBirthDate } from "./lib/astrology";
import { promptForDate, todayKey } from "./lib/prompts";

/** Works on phone LAN HTTP (non-secure context) where crypto.randomUUID is missing. */
function id(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand.slice(0, 12)}`;
}

function defaultBoard(): VisionBoard {
  return {
    id: id("board"),
    name: "My dream board",
    theme: "midnight",
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

interface VisionState {
  tab: TabId;
  boards: VisionBoard[];
  activeBoardId: string;
  goals: Goal[];
  affirmations: Affirmation[];
  journal: JournalEntry[];
  profile: UserProfile;
  sleepMode: boolean;

  setTab: (t: TabId) => void;
  setSleepMode: (v: boolean) => void;

  // Board
  activeBoard: () => VisionBoard;
  setActiveBoard: (boardId: string) => void;
  setBoardName: (name: string) => void;
  setBoardTheme: (theme: BoardThemeId) => void;
  addBoardItem: (partial: Omit<BoardItem, "id" | "z"> & { z?: number }) => void;
  /** Add many images in one save (multi-upload). */
  addBoardItems: (
    partials: Array<Partial<Omit<BoardItem, "id">> & { src?: string; z?: number }>,
  ) => void;
  addTextItem: (text?: string) => void;
  updateBoardItem: (itemId: string, patch: Partial<BoardItem>) => void;
  removeBoardItem: (itemId: string) => void;
  bringToFront: (itemId: string) => void;
  newBoard: (name?: string) => void;
  duplicateBoard: (boardId?: string) => void;
  deleteBoard: (boardId: string) => void;

  // Goals
  addGoal: (title: string, category?: string) => void;
  toggleGoal: (goalId: string) => void;
  removeGoal: (goalId: string) => void;
  updateGoal: (goalId: string, patch: Partial<Goal>) => void;

  // Affirmations
  addAffirmation: (text: string) => void;
  toggleFavorite: (id: string) => void;
  removeAffirmation: (id: string) => void;

  // Journal
  saveJournal: (body: string, prompt?: string) => void;
  todayEntry: () => JournalEntry | undefined;
  todayPrompt: () => string;

  // Profile
  setProfile: (patch: Partial<UserProfile>) => void;
  resolvedSign: () => ZodiacSign | null;
}

const starterAffirms: Affirmation[] = STARTER_AFFIRMATIONS.map((text) => ({
  id: id("aff"),
  text,
  favorite: false,
}));

const firstBoard = defaultBoard();

export const useVision = create<VisionState>()(
  persist(
    (set, get) => ({
      tab: "home",
      boards: [firstBoard],
      activeBoardId: firstBoard.id,
      goals: [],
      affirmations: starterAffirms,
      journal: [],
      profile: {
        name: "",
        birthDate: "",
        notifications: false,
        notifHour: 9,
      },
      sleepMode: false,

      setTab: (tab) => set({ tab }),
      setSleepMode: (sleepMode) => set({ sleepMode }),

      activeBoard: () => {
        const s = get();
        const boards = s.boards?.length ? s.boards : [defaultBoard()];
        return boards.find((b) => b.id === s.activeBoardId) || boards[0]!;
      },

      setActiveBoard: (boardId) => {
        const exists = get().boards.some((b) => b.id === boardId);
        if (exists) set({ activeBoardId: boardId });
      },

      setBoardName: (name) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === s.activeBoardId
              ? { ...b, name, updatedAt: new Date().toISOString() }
              : b,
          ),
        })),

      setBoardTheme: (theme) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === s.activeBoardId
              ? { ...b, theme, updatedAt: new Date().toISOString() }
              : b,
          ),
        })),

      addBoardItem: (partial) => {
        get().addBoardItems([partial]);
      },

      addBoardItems: (partials) =>
        set((s) => {
          if (!partials.length) return s;
          const board = s.boards.find((b) => b.id === s.activeBoardId);
          if (!board) return s;
          let maxZ = board.items.reduce((m, i) => Math.max(m, i.z), 0);
          const base = board.items.length;
          const items: BoardItem[] = partials.map((partial, i) => {
            maxZ += 1;
            const n = base + i;
            const kind = partial.kind || (partial.src ? "image" : "text");
            return {
              id: id("item"),
              kind,
              src: partial.src || "",
              label: partial.label || (kind === "text" ? "Your words" : ""),
              x: partial.x !== undefined ? partial.x : 10 + (n % 3) * 8,
              y: partial.y !== undefined ? partial.y : 8 + (n % 4) * 7,
              w: partial.w ?? (kind === "text" ? 42 : 34),
              h: partial.h ?? (kind === "text" ? 16 : 24),
              rotation:
                partial.rotation !== undefined
                  ? partial.rotation
                  : kind === "text"
                    ? 0
                    : (n % 5) - 2,
              z: partial.z ?? maxZ,
              goalId: partial.goalId,
              fontFamily: partial.fontFamily ?? (kind === "text" ? "serif" : undefined),
              fontSize: partial.fontSize ?? (kind === "text" ? 1 : undefined),
              fontWeight: partial.fontWeight ?? (kind === "text" ? 600 : undefined),
              fontStyle: partial.fontStyle ?? "normal",
              textAlign: partial.textAlign ?? "center",
              color: partial.color ?? (kind === "text" ? "#f4eef8" : undefined),
              bgColor:
                partial.bgColor ??
                (kind === "text" ? "rgba(0,0,0,0.35)" : undefined),
              aspect: partial.aspect ?? (kind === "text" ? "wide" : "free"),
            };
          });
          return {
            boards: s.boards.map((b) =>
              b.id === s.activeBoardId
                ? {
                    ...b,
                    items: [...b.items, ...items],
                    updatedAt: new Date().toISOString(),
                  }
                : b,
            ),
          };
        }),

      addTextItem: (text) => {
        get().addBoardItems([
          {
            kind: "text",
            src: "",
            label: text?.trim() || "I am becoming…",
            w: 48,
            h: 16,
            fontFamily: "serif",
            fontSize: 1.1,
            fontWeight: 600,
            textAlign: "center",
            color: "#f4eef8",
            bgColor: "rgba(0,0,0,0.4)",
            aspect: "wide",
            rotation: 0,
          },
        ]);
      },

      updateBoardItem: (itemId, patch) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id !== s.activeBoardId
              ? b
              : {
                  ...b,
                  items: b.items.map((i) =>
                    i.id === itemId ? { ...i, ...patch } : i,
                  ),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      removeBoardItem: (itemId) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id !== s.activeBoardId
              ? b
              : {
                  ...b,
                  items: b.items.filter((i) => i.id !== itemId),
                  updatedAt: new Date().toISOString(),
                },
          ),
        })),

      bringToFront: (itemId) =>
        set((s) => {
          const board = s.boards.find((b) => b.id === s.activeBoardId);
          if (!board) return s;
          const maxZ = board.items.reduce((m, i) => Math.max(m, i.z), 0);
          return {
            boards: s.boards.map((b) =>
              b.id !== s.activeBoardId
                ? b
                : {
                    ...b,
                    items: b.items.map((i) =>
                      i.id === itemId ? { ...i, z: maxZ + 1 } : i,
                    ),
                  },
            ),
          };
        }),

      newBoard: (name) => {
        const b = defaultBoard();
        if (name?.trim()) b.name = name.trim();
        else b.name = `Dream board ${get().boards.length + 1}`;
        set((s) => ({
          boards: [...s.boards, b],
          activeBoardId: b.id,
          tab: "board",
        }));
      },

      duplicateBoard: (boardId) => {
        const s = get();
        const src = s.boards.find((b) => b.id === (boardId || s.activeBoardId));
        if (!src) return;
        const copy: VisionBoard = {
          ...src,
          id: id("board"),
          name: `${src.name} (copy)`,
          items: src.items.map((it) => ({ ...it, id: id("item") })),
          updatedAt: new Date().toISOString(),
        };
        set({
          boards: [...s.boards, copy],
          activeBoardId: copy.id,
        });
      },

      deleteBoard: (boardId) =>
        set((s) => {
          if (s.boards.length <= 1) return s; // keep at least one
          const boards = s.boards.filter((b) => b.id !== boardId);
          const activeBoardId =
            s.activeBoardId === boardId ? boards[0]!.id : s.activeBoardId;
          return { boards, activeBoardId };
        }),

      addGoal: (title, category = "dream") =>
        set((s) => ({
          goals: [
            {
              id: id("goal"),
              title: title.trim(),
              notes: "",
              category,
              done: false,
              createdAt: new Date().toISOString(),
            },
            ...s.goals,
          ],
        })),

      toggleGoal: (goalId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id !== goalId
              ? g
              : {
                  ...g,
                  done: !g.done,
                  doneAt: !g.done ? new Date().toISOString() : undefined,
                },
          ),
        })),

      removeGoal: (goalId) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== goalId) })),

      updateGoal: (goalId, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)),
        })),

      addAffirmation: (text) =>
        set((s) => ({
          affirmations: [
            { id: id("aff"), text: text.trim(), favorite: true },
            ...s.affirmations,
          ],
        })),

      toggleFavorite: (affId) =>
        set((s) => ({
          affirmations: s.affirmations.map((a) =>
            a.id === affId ? { ...a, favorite: !a.favorite } : a,
          ),
        })),

      removeAffirmation: (affId) =>
        set((s) => ({
          affirmations: s.affirmations.filter((a) => a.id !== affId),
        })),

      saveJournal: (body, prompt) => {
        const date = todayKey();
        const p = prompt || promptForDate(date);
        set((s) => {
          const existing = s.journal.find((j) => j.date === date);
          if (existing) {
            return {
              journal: s.journal.map((j) =>
                j.date === date ? { ...j, body, prompt: p } : j,
              ),
            };
          }
          return {
            journal: [
              { id: id("jr"), date, prompt: p, body },
              ...s.journal,
            ],
          };
        });
      },

      todayEntry: () => get().journal.find((j) => j.date === todayKey()),
      todayPrompt: () => promptForDate(todayKey()),

      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      resolvedSign: () => {
        const { profile } = get();
        if (profile.sign) return profile.sign;
        return signFromBirthDate(profile.birthDate);
      },
    }),
    {
      name: "vision-app-v1",
      version: 3,
      partialize: (s) => ({
        boards: s.boards,
        activeBoardId: s.activeBoardId,
        goals: s.goals,
        affirmations: s.affirmations,
        journal: s.journal,
        profile: s.profile,
      }),
      // If localStorage is full / corrupt (common after big image boards on iOS),
      // don't crash the whole app into a black screen.
      merge: (persisted, current) => {
        try {
          const p = (persisted || {}) as Partial<VisionState>;
          const boards = Array.isArray(p.boards) && p.boards.length > 0
            ? p.boards.map((b) => ({
                ...b,
                items: (b.items || []).map((it) => ({
                  ...it,
                  kind: it.kind || (it.src ? ("image" as const) : ("text" as const)),
                  src: it.src || "",
                  label: it.label || "",
                })),
              }))
            : current.boards;
          const activeBoardId =
            p.activeBoardId && boards.some((b) => b.id === p.activeBoardId)
              ? p.activeBoardId
              : boards[0]!.id;
          return {
            ...current,
            ...p,
            boards,
            activeBoardId,
            goals: Array.isArray(p.goals) ? p.goals : current.goals,
            affirmations: Array.isArray(p.affirmations)
              ? p.affirmations
              : current.affirmations,
            journal: Array.isArray(p.journal) ? p.journal : current.journal,
            profile: { ...current.profile, ...(p.profile || {}) },
          };
        } catch {
          return current;
        }
      },
    },
  ),
);
