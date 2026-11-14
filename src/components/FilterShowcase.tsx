"use client";
import { useState } from "react";
import DemoPhoto from "./DemoPhoto";
import { FILTERS, FILTER_CATEGORIES, type FilterCategory } from "@/lib/data";

export default function FilterShowcase() {
  const [cat, setCat] = useState<FilterCategory>(FILTER_CATEGORIES[0]);
  const [selId, setSelId] = useState(FILTERS[0].id);
  const [amount, setAmount] = useState(80);
  const list = FILTERS.filter((f) => f.category === cat);
  const sel = FILTERS.find((f) => f.id === selId) ?? FILTERS[0];

  function pickCategory(c: FilterCategory) {
    setCat(c);
    const first = FILTERS.find((f) => f.category === c);
    if (first) setSelId(first.id);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-line">
          <DemoPhoto hue={330} className="absolute inset-0 h-full w-full" />
          <DemoPhoto hue={330} className="absolute inset-0 h-full w-full" style={{ filter: sel.css, opacity: amount / 100 }} />
        </div>
        <label className="mt-4 block text-sm font-medium" htmlFor="intensity">
          {sel.name} intensity: {amount}%
        </label>
        <input id="intensity" type="range" min={0} max={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2 w-full accent-[rgb(var(--accent))]" />
        <button type="button" onClick={() => setAmount(80)} className="mt-2 text-sm text-muted underline underline-offset-4 hover:text-fg">Reset intensity</button>
      </div>

      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter categories">
          {FILTER_CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={c === cat} onClick={() => pickCategory(c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${c === cat ? "border-fg bg-fg text-bg" : "border-line hover:bg-fg/5"}`}>
              {c}
            </button>
          ))}
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {list.map((f) => (
            <li key={f.id}>
              <button type="button" aria-pressed={f.id === selId} onClick={() => setSelId(f.id)} className={`w-full rounded-xl p-1.5 text-left transition ${f.id === selId ? "bg-card ring-2 ring-accent" : "ring-1 ring-line hover:bg-card"}`}>
                <div className="aspect-square overflow-hidden rounded-lg">
                  <DemoPhoto hue={330} className="h-full w-full" style={{ filter: f.css }} />
                </div>
                <span className="mt-2 block px-1 pb-1 text-sm font-medium">{f.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">Shown on a demo illustration. On your own photos, filters arrive with the camera and filter engine in the next phases.</p>
      </div>
    </div>
  );
}
