"use client";
import { useEffect, useRef } from "react";
import { geometry, renderComposition, type Edit } from "@/lib/compose";

type Props = { edit: Edit; images: HTMLImageElement[]; selectedId: number | null; onSelect: (id: number | null) => void; onMove: (id: number, x: number, y: number) => void };
const clamp = (v: number) => Math.min(1, Math.max(0, v));

export default function PreviewCanvas({ edit, images, selectedId, onSelect, onMove }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const drag = useRef<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (cache.current.size > 24) cache.current.clear();
    renderComposition(ref.current, edit, images, 1, cache.current);
  }, [edit, images]);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  function down(e: React.PointerEvent) {
    const { x, y } = pos(e);
    const { W, H } = geometry(edit.layout, edit.pad, edit.gap);
    let hit: number | null = null;
    for (let i = edit.layers.length - 1; i >= 0; i--) {
      const l = edit.layers[i];
      if (Math.hypot((x - l.x) * W, (y - l.y) * H) <= l.size * W * 0.6) { hit = l.id; break; }
    }
    onSelect(hit);
    drag.current = hit;
    if (hit !== null) ref.current?.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (drag.current === null) return;
    const { x, y } = pos(e);
    onMove(drag.current, clamp(x), clamp(y));
  }

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Photo composition preview. Drag stickers and text to move them."
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      style={{ touchAction: edit.layers.length ? "none" : "auto" }}
      className={`mx-auto block h-auto w-full max-w-sm rounded-md shadow-lg ring-1 ring-line ${selectedId !== null ? "cursor-move" : ""}`}
    />
  );
}
