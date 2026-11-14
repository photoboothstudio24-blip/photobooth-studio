"use client";
import { useState } from "react";
import TemplateMock from "@/components/TemplateMock";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/data";
import type { Edit, LayoutId } from "@/lib/compose";
import { atLeast, entitlements, templateMin, tierLabel, type Tier } from "@/lib/entitlements";
import Range from "./Range";

const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";

export default function LayoutPanel({ tier, edit, update }: { tier: Tier; edit: Edit; update: (p: Partial<Edit>, d?: boolean) => void }) {
  const [cat, setCat] = useState("All");
  const custom = entitlements(tier).customColors;
  const list = TEMPLATES.filter((t) => cat === "All" || t.category === cat);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Template categories">
          {TEMPLATE_CATEGORIES.map((c) => <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1.5 text-sm ${c === cat ? "border-fg bg-fg text-bg" : "border-line hover:bg-fg/5"}`}>{c}</button>)}
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {list.map((t) => (
            <li key={t.id}>
              <button type="button" aria-pressed={edit.templateId === t.id} disabled={!atLeast(tier, templateMin(t.id))} onClick={() => update({ templateId: t.id, layout: t.layout as LayoutId, bg: t.bg, ink: t.ink, caption: t.name }, true)} className={`block w-full rounded-lg p-1 disabled:opacity-50 ${edit.templateId === t.id ? "ring-2 ring-accent" : "ring-1 ring-line"}`}>
                <TemplateMock t={t} />
                {!atLeast(tier, templateMin(t.id)) && <span className="block pt-1 text-center text-xs text-muted">{tierLabel(templateMin(t.id))}</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Layouts with more spots than photos reuse your photos in order.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Background{custom ? "" : " (Premium)"}<input type="color" disabled={!custom} value={edit.bg} onChange={(e) => update({ bg: e.target.value })} className={`${field} h-10 p-1`} /></label>
        <label className="text-sm">Text and sticker color{custom ? "" : " (Premium)"}<input type="color" disabled={!custom} value={edit.ink} onChange={(e) => update({ ink: e.target.value })} className={`${field} h-10 p-1`} /></label>
        <label className="text-sm">Photo border color{custom ? "" : " (Premium)"}<input type="color" disabled={!custom} value={edit.borderColor} onChange={(e) => update({ borderColor: e.target.value })} className={`${field} h-10 p-1`} /></label>
        <Range label="Photo border" value={edit.borderW} min={0} max={14} onChange={(v) => update({ borderW: v })} />
        <Range label="Outer spacing" value={edit.pad} min={8} max={40} onChange={(v) => update({ pad: v })} />
        <Range label="Space between photos" value={edit.gap} min={0} max={24} onChange={(v) => update({ gap: v })} />
        <label className="text-sm sm:col-span-2">Caption (leave empty for none)
          <input type="text" maxLength={40} value={edit.caption} onChange={(e) => update({ caption: e.target.value })} className={field} />
        </label>
      </div>
    </div>
  );
}
