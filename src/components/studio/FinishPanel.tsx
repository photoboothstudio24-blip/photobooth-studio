"use client";
import { useState } from "react";
import { nextLayerId, renderComposition, safeScale, type Edit, type Layer } from "@/lib/compose";
import { atLeast, entitlements, STICKER_MIN, tierLabel, type Tier } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/client";
import Range from "./Range";

const STICKERS: Record<string, string[]> = {
  Love: ["❤️", "💕", "😍", "💌", "💖"],
  Cute: ["🐱", "🧸", "🎀", "🐰", "🍓"],
  Birthday: ["🎂", "🎉", "🎈", "🎁", "🥳"],
  Wedding: ["💍", "💐", "🤍", "🕊️", "🥂"],
  Retro: ["📼", "📷", "✌️", "🕶️", "💿"],
  Stars: ["⭐", "🌟", "💫", "✨", "🌙"],
  Flowers: ["🌸", "🌼", "🌷", "🌻", "🌹"],
};
const btn = "rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40";

type Props = { tier: Tier; sessionId: string | null; downloadUsed: boolean; onDownloaded: () => void; edit: Edit; update: (p: Partial<Edit> | ((e: Edit) => Partial<Edit>), d?: boolean) => void; images: HTMLImageElement[]; selectedId: number | null; setSelected: (id: number | null) => void };

export default function FinishPanel({ tier, sessionId, downloadUsed, onDownloaded, edit, update, images, selectedId, setSelected }: Props) {
  const [cat, setCat] = useState("Love");
  const [text, setText] = useState("");
  const [fmt, setFmt] = useState<"jpg" | "png">("jpg");
  const [quality, setQuality] = useState(2);
  const [msg, setMsg] = useState("");
  const ent = entitlements(tier);
  const sel = edit.layers.find((l) => l.id === selectedId);

  function add(kind: Layer["kind"], value: string) {
    if (!value.trim()) return;
    const id = nextLayerId();
    update((e) => ({ layers: [...e.layers, { id, kind, value, x: 0.5, y: 0.5, size: kind === "emoji" ? 0.14 : 0.08, rot: 0, opacity: 1 }] }), true);
    setSelected(id);
  }
  function patch(p: Partial<Layer>) {
    update((e) => ({ layers: e.layers.map((l) => (l.id === selectedId ? { ...l, ...p } : l)) }));
  }
  function order(dir: 1 | -1) {
    update((e) => {
      const i = e.layers.findIndex((l) => l.id === selectedId), j = i + dir;
      if (i < 0 || j < 0 || j >= e.layers.length) return {};
      const arr = [...e.layers];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { layers: arr };
    }, true);
  }
  function remove() {
    update((e) => ({ layers: e.layers.filter((l) => l.id !== selectedId) }), true);
    setSelected(null);
  }
  function makeBlob(): Promise<Blob | null> {
    const c = document.createElement("canvas");
    renderComposition(c, edit, images, safeScale(edit.layout, edit.pad, edit.gap, quality));
    return new Promise((res) => c.toBlob(res, fmt === "png" ? "image/png" : "image/jpeg", 0.95));
  }
  /** FREE: one download per session, recorded on the server. Paid plans are not limited. */
  async function allow(): Promise<boolean> {
    if (tier !== "free") return true;
    if (downloadUsed || !sessionId) { setMsg("Your free download for this session is used. Upgrade to download more."); return false; }
    const { data, error } = await createClient().rpc("mark_download", { p_session: sessionId });
    if (error || data !== true) { setMsg("Could not confirm your free download. Please try again."); return false; }
    onDownloaded();
    return true;
  }
  async function download() {
    setMsg("");
    if (!(await allow())) return;
    const blob = await makeBlob();
    if (!blob) return setMsg("Export failed. Try a lower quality.");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `photobooth-studio-${Date.now()}.${fmt}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg("Downloaded.");
  }
  async function share() {
    if (!ent.share) return;
    const blob = await makeBlob();
    if (!blob) return setMsg("Export failed.");
    const file = new File([blob], `photobooth-studio.${fmt}`, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }).catch(() => undefined);
    else setMsg("Sharing files is not supported in this browser. Use Download instead.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-lg font-bold">Stickers</h3>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Sticker categories">
          {Object.keys(STICKERS).map((c) => <button key={c} type="button" aria-pressed={c === cat} disabled={!atLeast(tier, STICKER_MIN[c])} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1.5 text-sm disabled:opacity-50 ${c === cat ? "border-fg bg-fg text-bg" : "border-line"}`}>{c}{atLeast(tier, STICKER_MIN[c]) ? "" : ` · ${tierLabel(STICKER_MIN[c])}`}</button>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STICKERS[cat].map((s) => <button key={s} type="button" onClick={() => add("emoji", s)} aria-label={`Add ${s}`} className="grid h-12 w-12 place-items-center rounded-lg border border-line text-2xl hover:bg-fg/5">{s}</button>)}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); add("text", text); setText(""); }}>
          <input value={text} maxLength={30} onChange={(e) => setText(e.target.value)} placeholder="Add text" aria-label="Text to add" className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm" />
          <button type="submit" className={btn}>Add text</button>
        </form>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold">Layers</h3>
        {edit.layers.length === 0 ? <p className="mt-2 text-sm text-muted">No stickers or text yet. Add one above, then drag it on the preview.</p> : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {edit.layers.map((l) => <li key={l.id}><button type="button" aria-pressed={l.id === selectedId} onClick={() => setSelected(l.id)} className={`rounded-lg border px-3 py-1.5 text-sm ${l.id === selectedId ? "border-accent ring-1 ring-accent" : "border-line"}`}>{l.value}</button></li>)}
          </ul>
        )}
        {sel && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Range label="Size" value={Math.round(sel.size * 100)} min={3} max={40} onChange={(v) => patch({ size: v / 100 })} />
            <Range label="Rotation" value={sel.rot} min={-180} max={180} onChange={(v) => patch({ rot: v })} />
            <Range label="Opacity" value={Math.round(sel.opacity * 100)} min={10} max={100} onChange={(v) => patch({ opacity: v / 100 })} />
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" className={btn} onClick={() => order(1)}>Bring forward</button>
              <button type="button" className={btn} onClick={() => order(-1)}>Send back</button>
              <button type="button" className={btn} onClick={remove}>Delete</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold">Download</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Format" className="flex gap-2">
            {(["jpg", "png"] as const).map((f) => <button key={f} type="button" aria-pressed={fmt === f} disabled={f === "png" && !ent.png} title={f === "png" && !ent.png ? "PNG is part of Standard and up" : undefined} onClick={() => setFmt(f)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${fmt === f ? "border-fg bg-fg text-bg" : "border-line"}`}>{f.toUpperCase()}</button>)}
          </div>
          <label className="text-sm">Size{" "}
            <select value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="rounded-lg border border-line bg-card px-2 py-2">
              <option value={1}>Standard (1x)</option><option value={2}>High (2x)</option><option value={3} disabled={ent.maxScale < 3}>Maximum (3x, Premium)</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">Photos come from your camera, so larger sizes enlarge them rather than adding detail. Very large sizes are reduced automatically on weak devices.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={images.length === 0} onClick={() => void download()} className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg disabled:opacity-40">Download {fmt.toUpperCase()}</button>
          <button type="button" disabled={images.length === 0 || !ent.share} title={!ent.share ? "Sharing is part of Standard and up" : undefined} onClick={() => void share()} className={btn}>Share</button>
        </div>
        <p className="mt-2 text-sm text-muted" aria-live="polite">{msg}</p>
        {tier === "free" && <p className="text-xs text-muted">{downloadUsed ? "Free download used for this session." : "FREE includes 1 JPG download per session."}</p>}
      </div>
    </div>
  );
}
