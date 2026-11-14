"use client";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { captureFrame, checkSupport, mapError, nextShotId, openStream, stopStream, type CameraError, type Facing, type Shot } from "@/lib/camera";

const MAX_SHOTS = 3;
const DELAYS = [3, 5, 10];
type Status = "idle" | "starting" | "live";

const btn = "rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40";
const btnOutline = `${btn} border border-line hover:bg-fg/5`;

export default function CameraStudio({ shots, setShots }: { shots: Shot[]; setShots: Dispatch<SetStateAction<Shot[]>> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const token = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<CameraError | null>(null);
  const [facing, setFacing] = useState<Facing>("user");
  const [mirror, setMirror] = useState(true);
  const [delay, setDelay] = useState(3);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [fs, setFs] = useState(false);
  const [canFs, setCanFs] = useState(false);
  const mirrorRef = useRef(mirror);
  mirrorRef.current = mirror;
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  const stop = useCallback(() => {
    token.current++;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCount(null);
    setStatus("idle");
  }, []);

  const start = useCallback(async (f: Facing) => {
    const unsupported = checkSupport();
    if (unsupported) return setError(unsupported);
    setError(null);
    setViewId(null);
    setStatus("starting");
    stopStream(streamRef.current);
    streamRef.current = null;
    const mine = ++token.current;
    try {
      const stream = await openStream(f);
      if (mine !== token.current) return stopStream(stream);
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => undefined);
      }
      setStatus("live");
    } catch (e) {
      if (mine !== token.current) return;
      setError(mapError(e));
      setStatus("idle");
    }
  }, []);

  const snap = useCallback(async () => {
    const v = videoRef.current;
    if (!v || shotsRef.current.length >= MAX_SHOTS) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    try {
      const blob = await captureFrame(v, mirrorRef.current);
      const next = [...shotsRef.current, { id: nextShotId(), url: URL.createObjectURL(blob) }];
      setShots(next);
      if (next.length >= MAX_SHOTS) stop();
    } catch {
      setError({ kind: "unknown", message: "The photo could not be captured. Try again." });
    }
  }, [stop]);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      setCount(null);
      void snap();
      return;
    }
    const t = setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [count, snap]);

  useEffect(() => {
    setCanFs(!!document.fullscreenEnabled);
    const onFs = () => setFs(!!document.fullscreenElement);
    const onHide = () => document.hidden && stop();
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("visibilitychange", onHide);
      stopStream(streamRef.current);
    };
  }, [stop]);

  function switchCamera() {
    const f: Facing = facing === "user" ? "environment" : "user";
    setFacing(f);
    setMirror(f === "user");
    void start(f);
  }
  function retake(id: number) {
    const s = shots.find((x) => x.id === id);
    if (s) URL.revokeObjectURL(s.url);
    setShots((all) => all.filter((x) => x.id !== id));
    setViewId(null);
    if (status === "idle") void start(facing);
  }
  function clearAll() {
    shots.forEach((s) => URL.revokeObjectURL(s.url));
    setShots([]);
    setViewId(null);
  }
  function toggleFs() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void panelRef.current?.requestFullscreen().catch(() => undefined);
  }

  const live = status === "live";
  const full = shots.length >= MAX_SHOTS;
  const viewing = shots.find((s) => s.id === viewId);

  return (
    <div ref={panelRef} className={`mx-auto w-full max-w-2xl ${fs ? "overflow-auto bg-bg p-4" : ""}`}>
      <div className="relative mx-auto aspect-[3/4] w-[min(100%,28rem,calc(70vh*0.75))] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-line">
        <video ref={videoRef} playsInline muted autoPlay aria-label="Camera preview" className={`absolute inset-0 h-full w-full object-cover ${live && !viewing ? "" : "invisible"}`} style={{ transform: mirror ? "scaleX(-1)" : undefined }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {viewing && <img src={viewing.url} alt="Captured photo preview" className="absolute inset-0 h-full w-full object-cover" />}
        {!live && !viewing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            {error ? (
              <p role="alert" className="max-w-xs text-sm leading-relaxed">{error.message}</p>
            ) : (
              <p className="max-w-xs text-sm leading-relaxed text-white/80">
                {full ? "You have 3 photos. Retake any of them below." : "Your camera starts only when you press the button. Photos stay in this browser tab."}
              </p>
            )}
            {!full && (
              <button type="button" onClick={() => void start(facing)} disabled={status === "starting"} className={`${btn} bg-accent text-accent-fg`}>
                {status === "starting" ? "Starting…" : error ? "Try again" : "Open camera"}
              </button>
            )}
          </div>
        )}
        {count !== null && count > 0 && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 font-display text-9xl font-extrabold text-white" aria-live="assertive">{count}</div>
        )}
        <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${flash ? "opacity-90" : "opacity-0"}`} />
        {viewing && (
          <button type="button" onClick={() => setViewId(null)} className={`${btn} absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-neutral-900`}>Back</button>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-muted" aria-live="polite">Photo {Math.min(shots.length + (full ? 0 : 1), MAX_SHOTS)} of {MAX_SHOTS}</p>

      {live && !viewing && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Countdown">
            {DELAYS.map((d) => (
              <button key={d} type="button" aria-pressed={d === delay} disabled={count !== null} onClick={() => setDelay(d)} className={`${btn} border ${d === delay ? "border-fg bg-fg text-bg" : "border-line hover:bg-fg/5"}`}>{d}s</button>
            ))}
          </div>
          <button type="button" disabled={count !== null} onClick={() => setCount(delay)} className={`${btn} bg-accent px-8 py-3 text-base text-accent-fg`}>
            {count !== null ? "Get ready…" : "Take photo"}
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={btnOutline} disabled={count !== null} onClick={switchCamera}>Switch camera</button>
            <button type="button" className={btnOutline} aria-pressed={mirror} onClick={() => setMirror(!mirror)}>Mirror: {mirror ? "on" : "off"}</button>
            {canFs && <button type="button" className={btnOutline} onClick={toggleFs}>{fs ? "Exit fullscreen" : "Fullscreen"}</button>}
            <button type="button" className={btnOutline} onClick={stop}>Stop camera</button>
          </div>
          <p className="text-xs text-muted">The white flash is a screen effect, not your camera flash.</p>
        </div>
      )}

      <ul className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_SHOTS }, (_, i) => {
          const s = shots[i];
          return (
            <li key={i}>
              {s ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <button type="button" onClick={() => setViewId(s.id)} aria-label={`View photo ${i + 1}`} className="block aspect-[3/4] w-full overflow-hidden rounded-lg ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><img src={s.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" /></button>
                  <button type="button" onClick={() => retake(s.id)} className="mt-2 w-full text-sm text-muted underline underline-offset-4 hover:text-fg">Retake</button>
                </>
              ) : (
                <div className="grid aspect-[3/4] w-full place-items-center rounded-lg border border-dashed border-line text-sm text-muted">{i + 1}</div>
              )}
            </li>
          );
        })}
      </ul>
      {shots.length > 0 && <div className="mt-4 text-center"><button type="button" onClick={clearAll} className={btnOutline}>Start over</button></div>}
    </div>
  );
}
