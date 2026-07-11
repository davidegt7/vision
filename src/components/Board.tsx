import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useVision } from "../store";
import { BOARD_THEMES } from "../lib/themes";
import {
  ASPECT_PRESETS,
  BOARD_FONTS,
  TEXT_BG_COLORS,
  TEXT_COLORS,
} from "../lib/boardFonts";
import type {
  BoardAspectId,
  BoardFontId,
  BoardItem,
  BoardThemeId,
} from "../types";

function itemKind(item: BoardItem): "image" | "text" {
  if (item.kind === "text" || item.kind === "image") return item.kind;
  return item.src ? "image" : "text";
}

const MAX_DATA_URL = 1_800_000; // ~ keep localStorage sane

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function compressImage(file: File, maxEdge = 1200): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    let quality = 0.82;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > MAX_DATA_URL && quality > 0.4) {
      quality -= 0.1;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  // Some phones/OS leave type empty for HEIC etc.
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name);
}

export function Board() {
  const board = useVision((s) => s.activeBoard());
  const boards = useVision((s) => s.boards);
  const activeBoardId = useVision((s) => s.activeBoardId);
  const setActiveBoard = useVision((s) => s.setActiveBoard);
  const setBoardName = useVision((s) => s.setBoardName);
  const setBoardTheme = useVision((s) => s.setBoardTheme);
  const addBoardItems = useVision((s) => s.addBoardItems);
  const addTextItem = useVision((s) => s.addTextItem);
  const updateBoardItem = useVision((s) => s.updateBoardItem);
  const removeBoardItem = useVision((s) => s.removeBoardItem);
  const bringToFront = useVision((s) => s.bringToFront);
  const addGoal = useVision((s) => s.addGoal);
  const newBoard = useVision((s) => s.newBoard);
  const duplicateBoard = useVision((s) => s.duplicateBoard);
  const deleteBoard = useVision((s) => s.deleteBoard);

  const [selected, setSelected] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [status, setStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
  } | null>(null);

  const theme = BOARD_THEMES[board.theme];

  const onFiles = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter(isImageFile);
    if (!list.length) {
      setStatus("No image files found — try JPG, PNG, or WebP");
      return;
    }
    setUploading(true);
    setStatus(
      list.length === 1
        ? "Adding 1 image…"
        : `Adding ${list.length} images…`,
    );
    const prepared: Array<{ src: string; label: string }> = [];
    let failed = 0;
    for (const file of list) {
      try {
        let src: string;
        if (file.size > 400_000 || !file.type) src = await compressImage(file);
        else src = await readFileAsDataUrl(file);
        if (src.length > MAX_DATA_URL) src = await compressImage(file, 900);
        prepared.push({
          src,
          label: file.name.replace(/\.[^.]+$/, ""),
        });
      } catch {
        failed += 1;
      }
    }
    if (prepared.length) {
      // One store update so multi-upload never stacks on the same spot.
      // Omit x/y so the store fans them out automatically.
      addBoardItems(
        prepared.map((p) => ({
          kind: "image" as const,
          src: p.src,
          label: p.label,
          w: 34,
          h: 24,
        })),
      );
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (prepared.length && !failed) {
      setStatus(
        prepared.length === 1
          ? "Saved · 1 image on this board"
          : `Saved · ${prepared.length} images on this board`,
      );
    } else if (prepared.length) {
      setStatus(`Saved ${prepared.length} · ${failed} failed`);
    } else {
      setStatus("Couldn’t add those images");
    }
  };

  const addFromUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    addBoardItems([
      {
        kind: "image",
        src: u,
        label: "From link",
        w: 34,
        h: 24,
      },
    ]);
    setUrlDraft("");
    setStatus("Saved · link added (auto-saves in this browser)");
  };

  const openPinterest = () => {
    const q = encodeURIComponent(board.name || "dream life vision board");
    window.open(`https://www.pinterest.com/search/pins/?q=${q}`, "_blank", "noopener");
  };

  const onPointerDown = (e: ReactPointerEvent, item: BoardItem, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    bringToFront(item.id);
    setSelected(item.id);
    const el = boardRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: item.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      ox: item.x,
      oy: item.y,
      ow: item.w,
      oh: item.h,
    };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    const el = boardRef.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / rect.width) * 100;
    const dy = ((e.clientY - d.startY) / rect.height) * 100;
    if (d.mode === "move") {
      updateBoardItem(d.id, {
        x: Math.min(90, Math.max(0, d.ox + dx)),
        y: Math.min(90, Math.max(0, d.oy + dy)),
      });
    } else {
      updateBoardItem(d.id, {
        w: Math.min(80, Math.max(10, d.ow + dx)),
        h: Math.min(70, Math.max(8, d.oh + dy)),
        aspect: "free",
      });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const exportWallpaper = async () => {
    const el = boardRef.current;
    if (!el) return;
    setStatus("Rendering wallpaper…");
    // Draw board to canvas at phone wallpaper-ish size
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient approx by theme solid
    const gradients: Record<string, [string, string]> = {
      midnight: ["#0f0a1a", "#2a1848"],
      blush: ["#2a1520", "#4a2838"],
      forest: ["#0c1612", "#1a3328"],
      sand: ["#1c1812", "#3a3020"],
      aurora: ["#0a1220", "#241830"],
      paper: ["#1a1816", "#24201c"],
    };
    const [c0, c1] = gradients[board.theme] || gradients.midnight!;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /** Same as CSS object-fit: cover — crop source, never stretch. */
    const drawImageCover = (
      image: HTMLImageElement,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
      radius: number,
    ) => {
      const iw = image.naturalWidth || image.width;
      const ih = image.naturalHeight || image.height;
      if (!iw || !ih || dw <= 0 || dh <= 0) return;
      const scale = Math.max(dw / iw, dh / ih);
      const sw = dw / scale;
      const sh = dh / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx.beginPath();
      // rounded rect clip to match .board-item
      const r = Math.min(radius, dw / 2, dh / 2);
      const x0 = dx;
      const y0 = dy;
      ctx.moveTo(x0 + r, y0);
      ctx.arcTo(x0 + dw, y0, x0 + dw, y0 + dh, r);
      ctx.arcTo(x0 + dw, y0 + dh, x0, y0 + dh, r);
      ctx.arcTo(x0, y0 + dh, x0, y0, r);
      ctx.arcTo(x0, y0, x0 + dw, y0, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    };

    const sorted = [...board.items].sort((a, b) => a.z - b.z);
    for (const item of sorted) {
      const x = (item.x / 100) * W;
      const y = (item.y / 100) * H;
      const w = (item.w / 100) * W;
      const h = (item.h / 100) * H;
      const rr = 18;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 8;

      if (itemKind(item) === "text") {
        const bg = item.bgColor && item.bgColor !== "transparent" ? item.bgColor : "rgba(0,0,0,0.35)";
        ctx.fillStyle = bg === "transparent" ? "rgba(0,0,0,0)" : bg;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, rr);
        ctx.fill();
        ctx.shadowColor = "transparent";
        const fontId = (item.fontFamily || "serif") as BoardFontId;
        const stack = BOARD_FONTS[fontId]?.stack || BOARD_FONTS.serif.stack;
        const scale = item.fontSize ?? 1;
        const weight = item.fontWeight ?? 600;
        const style = item.fontStyle === "italic" ? "italic" : "normal";
        const fontPx = Math.max(18, Math.round(h * 0.22 * scale));
        ctx.font = `${style} ${weight} ${fontPx}px ${stack}`;
        ctx.fillStyle = item.color || "#f4eef8";
        ctx.textAlign = item.textAlign || "center";
        ctx.textBaseline = "middle";
        const text = item.label || "";
        const maxWidth = w * 0.88;
        // simple wrap
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const word of words) {
          const trial = cur ? `${cur} ${word}` : word;
          if (ctx.measureText(trial).width <= maxWidth || !cur) cur = trial;
          else {
            lines.push(cur);
            cur = word;
          }
        }
        if (cur) lines.push(cur);
        const lineH = fontPx * 1.2;
        const blockH = lines.length * lineH;
        let ty = -blockH / 2 + lineH / 2;
        const tx =
          item.textAlign === "left"
            ? -w / 2 + w * 0.08
            : item.textAlign === "right"
              ? w / 2 - w * 0.08
              : 0;
        for (const line of lines.slice(0, 8)) {
          ctx.fillText(line, tx, ty, maxWidth);
          ty += lineH;
        }
      } else {
        try {
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image();
            if (item.src && !item.src.startsWith("data:")) i.crossOrigin = "anonymous";
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = item.src;
          });
          ctx.fillStyle = "rgba(0,0,0,0.01)";
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h, rr);
          ctx.fill();
          ctx.shadowColor = "transparent";
          drawImageCover(img, -w / 2, -h / 2, w, h, rr);
        } catch {
          // skip CORS-blocked remote images
        }
      }
      ctx.restore();
    }

    // Soft brand footer
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("vision", W / 2, H - 48);

    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("Export failed");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${board.name.replace(/\s+/g, "-") || "vision"}-wallpaper.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus("Wallpaper saved — set it as your lock screen ✨");
    }, "image/png");
  };

  const selectedItem = board.items.find((i) => i.id === selected);

  return (
    <div className="page board-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Dream board · auto-saved</p>
          <input
            className="title-input"
            value={board.name}
            onChange={(e) => setBoardName(e.target.value)}
            aria-label="Board name"
          />
        </div>
      </header>

      {/* Library of saved boards — creating new never deletes the old ones */}
      <div className="board-library">
        <div className="board-library-scroll">
          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`board-chip ${b.id === activeBoardId ? "on" : ""}`}
              onClick={() => {
                setActiveBoard(b.id);
                setSelected(null);
                setStatus(`Opened “${b.name}”`);
              }}
            >
              <span className="board-chip-name">{b.name}</span>
              <span className="board-chip-meta">{b.items.length} pics</span>
            </button>
          ))}
        </div>
        <div className="board-library-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              newBoard();
              setSelected(null);
              setStatus("New board created · your other boards are still saved");
            }}
          >
            + New board
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              duplicateBoard();
              setStatus("Duplicated · both boards are saved");
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="btn ghost danger"
            disabled={boards.length <= 1}
            title={
              boards.length <= 1
                ? "Keep at least one board"
                : "Delete this board only"
            }
            onClick={() => {
              if (boards.length <= 1) return;
              if (
                !window.confirm(
                  `Delete “${board.name}”? Your other boards stay saved.`,
                )
              ) {
                return;
              }
              deleteBoard(board.id);
              setSelected(null);
              setStatus("Board deleted · others kept");
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="board-toolbar">
        <button
          type="button"
          className="btn primary"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Adding…" : "Upload images"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.avif"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files)}
        />
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            addTextItem("I am becoming…");
            setStatus("Text added — tap it to edit font & size");
          }}
        >
          + Add text
        </button>
        <button type="button" className="btn" onClick={openPinterest}>
          Open Pinterest
        </button>
        <button type="button" className="btn" onClick={() => void exportWallpaper()}>
          Save as wallpaper
        </button>
      </div>

      <div
        className={`drop-zone ${dragOver ? "over" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget === e.target) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void onFiles(e.dataTransfer.files);
        }}
      >
        <p>
          <strong>Drop many photos here</strong> or use Upload images — select
          several at once (⌘/Ctrl+click).
        </p>
      </div>

      <div className="url-row">
        <input
          type="url"
          placeholder="Paste image URL or Pinterest image address…"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFromUrl()}
        />
        <button type="button" className="btn" onClick={addFromUrl}>
          Add link
        </button>
      </div>

      <p className="hint">
        Everything auto-saves in this browser. Switch boards with the chips above —
        New board never erases the old one. Drag cards to move · corner to resize.
      </p>

      <div className="theme-row">
        {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`theme-swatch ${board.theme === t ? "on" : ""}`}
            style={{ background: BOARD_THEMES[t].bg }}
            title={BOARD_THEMES[t].label}
            onClick={() => setBoardTheme(t)}
          />
        ))}
      </div>

      <div
        ref={boardRef}
        className="vision-board"
        style={{ background: theme.bg }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => setSelected(null)}
      >
        {board.items.length === 0 && (
          <div className="board-empty">
            <p>Drop your dreams here</p>
            <p className="muted">Upload, paste a link, or grab inspo from Pinterest</p>
          </div>
        )}
        {[...board.items]
          .sort((a, b) => a.z - b.z)
          .map((item) => {
            const kind = itemKind(item);
            const fontId = (item.fontFamily || "serif") as BoardFontId;
            return (
              <div
                key={item.id}
                className={`board-item ${kind === "text" ? "text-item" : ""} ${selected === item.id ? "selected" : ""}`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: `${item.h}%`,
                  transform: `rotate(${item.rotation}deg)`,
                  zIndex: item.z,
                  ...(kind === "text"
                    ? {
                        background:
                          item.bgColor && item.bgColor !== "transparent"
                            ? item.bgColor
                            : "rgba(0,0,0,0.35)",
                        color: item.color || "#f4eef8",
                        fontFamily: BOARD_FONTS[fontId]?.stack,
                        fontSize: `${Math.max(0.55, item.fontSize ?? 1) * 0.95}rem`,
                        fontWeight: item.fontWeight ?? 600,
                        fontStyle: item.fontStyle ?? "normal",
                        textAlign: item.textAlign ?? "center",
                      }
                    : undefined),
                }}
                onPointerDown={(e) => onPointerDown(e, item, "move")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(item.id);
                }}
              >
                {kind === "text" ? (
                  <div className="board-text">{item.label || "Tap to edit"}</div>
                ) : (
                  <>
                    <img src={item.src} alt={item.label || "vision"} draggable={false} />
                    {item.label && <span className="item-label">{item.label}</span>}
                  </>
                )}
                <span
                  className="resize-handle"
                  onPointerDown={(e) => onPointerDown(e, item, "resize")}
                />
              </div>
            );
          })}
      </div>

      {selectedItem && (
        <div className="item-inspector">
          {itemKind(selectedItem) === "text" ? (
            <>
              <textarea
                className="text-edit"
                rows={2}
                value={selectedItem.label}
                placeholder="Write your vision…"
                onChange={(e) =>
                  updateBoardItem(selectedItem.id, { label: e.target.value })
                }
              />
              <label className="field">
                Font
                <select
                  value={selectedItem.fontFamily || "serif"}
                  onChange={(e) =>
                    updateBoardItem(selectedItem.id, {
                      fontFamily: e.target.value as BoardFontId,
                    })
                  }
                >
                  {(Object.keys(BOARD_FONTS) as BoardFontId[]).map((f) => (
                    <option key={f} value={f}>
                      {BOARD_FONTS[f].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline">
                Size
                <input
                  type="range"
                  min={0.6}
                  max={2.4}
                  step={0.05}
                  value={selectedItem.fontSize ?? 1}
                  onChange={(e) =>
                    updateBoardItem(selectedItem.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                Weight
                <select
                  value={selectedItem.fontWeight ?? 600}
                  onChange={(e) =>
                    updateBoardItem(selectedItem.id, {
                      fontWeight: Number(e.target.value) as 400 | 600 | 700,
                    })
                  }
                >
                  <option value={400}>Regular</option>
                  <option value={600}>Semi-bold</option>
                  <option value={700}>Bold</option>
                </select>
              </label>
              <label className="field">
                Style
                <select
                  value={selectedItem.fontStyle ?? "normal"}
                  onChange={(e) =>
                    updateBoardItem(selectedItem.id, {
                      fontStyle: e.target.value as "normal" | "italic",
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </label>
              <label className="field">
                Align
                <select
                  value={selectedItem.textAlign ?? "center"}
                  onChange={(e) =>
                    updateBoardItem(selectedItem.id, {
                      textAlign: e.target.value as "left" | "center" | "right",
                    })
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="field">
                Aspect
                <select
                  value={selectedItem.aspect || "wide"}
                  onChange={(e) => {
                    const aspect = e.target.value as BoardAspectId;
                    const preset = ASPECT_PRESETS[aspect];
                    updateBoardItem(selectedItem.id, {
                      aspect,
                      ...(aspect !== "free"
                        ? { w: preset.w, h: preset.h }
                        : {}),
                    });
                  }}
                >
                  {(Object.keys(ASPECT_PRESETS) as BoardAspectId[]).map((a) => (
                    <option key={a} value={a}>
                      {ASPECT_PRESETS[a].label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="color-row">
                <span className="muted tiny">Text</span>
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch ${selectedItem.color === c ? "on" : ""}`}
                    style={{ background: c }}
                    title={c}
                    onClick={() => updateBoardItem(selectedItem.id, { color: c })}
                  />
                ))}
              </div>
              <div className="color-row">
                <span className="muted tiny">Background</span>
                {TEXT_BG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch ${selectedItem.bgColor === c ? "on" : ""}`}
                    style={{
                      background:
                        c === "transparent"
                          ? "repeating-conic-gradient(#888 0% 25%, #444 0% 50%) 50% / 10px 10px"
                          : c,
                    }}
                    title={c}
                    onClick={() => updateBoardItem(selectedItem.id, { bgColor: c })}
                  />
                ))}
              </div>
            </>
          ) : (
            <input
              value={selectedItem.label}
              placeholder="Label this dream…"
              onChange={(e) =>
                updateBoardItem(selectedItem.id, { label: e.target.value })
              }
            />
          )}
          <label className="inline">
            Rotate
            <input
              type="range"
              min={-20}
              max={20}
              value={selectedItem.rotation}
              onChange={(e) =>
                updateBoardItem(selectedItem.id, {
                  rotation: Number(e.target.value),
                })
              }
            />
          </label>
          {itemKind(selectedItem) === "image" && (
            <label className="field">
              Aspect
              <select
                value={selectedItem.aspect || "free"}
                onChange={(e) => {
                  const aspect = e.target.value as BoardAspectId;
                  const preset = ASPECT_PRESETS[aspect];
                  updateBoardItem(selectedItem.id, {
                    aspect,
                    ...(aspect !== "free" ? { w: preset.w, h: preset.h } : {}),
                  });
                }}
              >
                {(Object.keys(ASPECT_PRESETS) as BoardAspectId[]).map((a) => (
                  <option key={a} value={a}>
                    {ASPECT_PRESETS[a].label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (selectedItem.label.trim())
                addGoal(selectedItem.label.trim(), "board");
              else addGoal("Board vision", "board");
              setStatus("Added to manifestation list ✓");
            }}
          >
            Track as goal
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              removeBoardItem(selectedItem.id);
              setSelected(null);
            }}
          >
            Remove
          </button>
        </div>
      )}

      {status && <p className="status-line">{status}</p>}
    </div>
  );
}
