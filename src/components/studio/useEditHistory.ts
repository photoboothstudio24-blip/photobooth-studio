"use client";
import { useCallback, useRef, useState } from "react";
import { DEFAULT_EDIT, type Edit } from "@/lib/compose";

type H = { past: Edit[]; present: Edit; future: Edit[] };

export function useEditHistory() {
  const [h, setH] = useState<H>({ past: [], present: DEFAULT_EDIT, future: [] });
  const last = useRef(0);
  /** Changes made within 500 ms of each other (slider drags) count as one undo step; discrete=true always starts a new step. */
  const update = useCallback((patch: Partial<Edit> | ((e: Edit) => Partial<Edit>), discrete = false) => {
    const now = Date.now();
    const push = discrete || now - last.current > 500;
    last.current = now;
    setH((s) => {
      const p = typeof patch === "function" ? patch(s.present) : patch;
      return { past: push ? [...s.past.slice(-49), s.present] : s.past, present: { ...s.present, ...p }, future: [] };
    });
  }, []);
  const undo = useCallback(() => setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s)), []);
  const redo = useCallback(() => setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)), []);
  const reset = useCallback(() => setH((s) => ({ past: [...s.past, s.present], present: DEFAULT_EDIT, future: [] })), []);
  return { edit: h.present, update, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}
