import DemoPhoto from "./DemoPhoto";
import type { Template } from "@/lib/data";

function Tile({ hue, className = "" }: { hue: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[3px] ${className}`}>
      <DemoPhoto hue={hue} className="h-full w-full" />
    </div>
  );
}

export default function TemplateMock({ t }: { t: Template }) {
  const h = (i: number) => t.hues[i % t.hues.length];
  const stripCount = t.layout === "strip2" ? 2 : t.layout === "strip3" ? 3 : t.layout === "strip4" ? 4 : 0;
  return (
    <div className="flex aspect-[3/4] flex-col gap-1.5 rounded-md p-2 shadow-sm ring-1 ring-black/10" style={{ background: t.bg, color: t.ink }}>
      {stripCount > 0 && Array.from({ length: stripCount }, (_, i) => <Tile key={i} hue={h(i)} className="min-h-0 flex-1" />)}
      {t.layout === "single" && <Tile hue={h(0)} className="min-h-0 flex-1" />}
      {t.layout === "polaroid" && <Tile hue={h(0)} className="min-h-0 flex-[4]" />}
      {t.layout === "collage" && (
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-1.5">
          <Tile hue={h(0)} className="col-span-2" />
          <Tile hue={h(1)} />
          <Tile hue={h(2)} />
          <Tile hue={h(3)} />
          <Tile hue={h(4)} />
        </div>
      )}
      <p className={`text-center font-display text-[10px] font-semibold ${t.layout === "polaroid" ? "flex-1 pt-2" : ""}`}>{t.name}</p>
    </div>
  );
}
