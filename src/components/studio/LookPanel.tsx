"use client";
import { useEffect, useRef, useState } from "react";
import { FILTERS, FILTER_CATEGORIES, type FilterCategory } from "@/lib/data";
import { ADJUST_FIELDS, ZERO_ADJ } from "@/lib/imaging";
import { cellCanvas, type Edit } from "@/lib/compose";
import { ADJUST_MIN, atLeast, filterMin, tierLabel, type Tier } from "@/lib/entitlements";
import Range from "./Range";

function Thumb({ img, id }: { img?: HTMLImageElement; id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = 72; c.height = 96;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (!img) { ctx.fillStyle = "#888"; ctx.fillRect(0, 0, 72, 96); return; }
    ctx.drawImage(cellCanvas(img, 72, 96, id, 100, ZERO_ADJ), 0, 0);
  }, [img, id]);
  return <canvas ref={ref} className="h-full w-full object-cover" aria-hidden="true" />;
}

export default function LookPanel({ tier, edit, update, img }: { tier: Tier; edit: Edit; update: (p: Partial<Edit>, d?: boolean) => void; img?: HTMLImageElement }) {
  const [cat, setCat] = useState<FilterCategory>(FILTER_CATEGORIES[0]);
  const list = FILTERS.filter((f) => f.category === cat);
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm ${on ? "border-fg bg-fg text-bg" : "border-line hover:bg-fg/5"}`;
  const Tile = ({ id, name }: { id: string; name: string }) => (
    <li>
      <button type="button" aria-pressed={edit.filterId === id} disabled={!atLeast(tier, id === "none" ? "free" : filterMin(id))} onClick={() => update({ filterId: id }, true)} className={`w-full rounded-lg p-1 text-left disabled:opacity-50 ${edit.filterId === id ? "ring-2 ring-accent" : "ring-1 ring-line"}`}>
        <div className="aspect-[3/4] overflow-hidden rounded-md"><Thumb img={img} id={id} /></div>
        <span className="mt-1 block truncate px-1 text-xs">{name}{!atLeast(tier, id === "none" ? "free" : filterMin(id)) ? ` · ${tierLabel(filterMin(id))}` : ""}</span>
      </button>
    </li>
  );
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter categories">
          {FILTER_CATEGORIES.map((c) => <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)} className={chip(c === cat)}>{c}</button>)}
        </div>
        <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
          <Tile id="none" name="Original" />
          {list.map((f) => <Tile key={f.id} id={f.id} name={f.name} />)}
        </ul>
        <div className="mt-4"><Range label="Filter intensity" value={edit.intensity} min={0} max={100} onChange={(v) => update({ intensity: v })} /></div>
      </div>
      <div>
        <h3 className="font-display text-lg font-bold">Adjustments</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ADJUST_FIELDS.map((f) => <Range key={f.key} disabled={!atLeast(tier, ADJUST_MIN[f.key])} label={atLeast(tier, ADJUST_MIN[f.key]) ? f.label : `${f.label} (${tierLabel(ADJUST_MIN[f.key])})`} value={edit.adj[f.key]} min={f.min} max={f.max} step={f.key === "blur" ? 0.5 : 1} onChange={(v) => update((e) => ({ adj: { ...e.adj, [f.key]: v } }))} />)}
        </div>
        <button type="button" onClick={() => update({ adj: { ...ZERO_ADJ }, filterId: "none", intensity: 80 }, true)} className="mt-3 text-sm text-muted underline underline-offset-4 hover:text-fg">Reset look</button>
      </div>
    </div>
  );
}
