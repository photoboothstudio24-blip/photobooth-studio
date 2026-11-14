"use client";
import { useState } from "react";
import TemplateMock from "./TemplateMock";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/data";

export default function TemplateShowcase() {
  const [cat, setCat] = useState("All");
  const list = TEMPLATES.filter((t) => cat === "All" || t.category === cat);
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Template categories">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${c === cat ? "border-fg bg-fg text-bg" : "border-line hover:bg-fg/5"}`}>
            {c}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="mt-8 text-muted">No templates in this category yet. More are on the way.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((t) => (
            <li key={t.id}>
              <TemplateMock t={t} />
              <p className="mt-2 text-sm text-muted">{t.category}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
