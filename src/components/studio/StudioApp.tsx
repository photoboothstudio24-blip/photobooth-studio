"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadImage } from "@/lib/compose";
import type { Shot } from "@/lib/camera";
import type { Tier } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/client";
import { ButtonLink } from "@/components/ui";
import CameraStudio from "./CameraStudio";
import FinishPanel from "./FinishPanel";
import LayoutPanel from "./LayoutPanel";
import LookPanel from "./LookPanel";
import PreviewCanvas from "./PreviewCanvas";
import { useEditHistory } from "./useEditHistory";

const STEPS = [["camera", "Camera"], ["look", "Look"], ["layout", "Layout"], ["finish", "Finish"]] as const;
type Step = (typeof STEPS)[number][0];
type Gate = { s: "loading" } | { s: "error"; msg: string } | { s: "idle"; remaining: number } | { s: "exhausted" } | { s: "active"; sessionId: string | null; downloadUsed: boolean; remaining: number | null };
type SessionRes = { allowed: boolean; session_id: string | null; remaining: number | null; download_used: boolean };
const tool = "rounded-full border border-line px-3 py-1.5 text-sm hover:bg-fg/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const Card = ({ children }: { children: React.ReactNode }) => <div className="mx-auto max-w-md rounded-2xl border border-line bg-card p-6 text-center">{children}</div>;

export default function StudioApp({ configured, signedIn, tier }: { configured: boolean; signedIn: boolean; tier: Tier }) {
  const [gate, setGate] = useState<Gate>({ s: "loading" });

  async function begin() {
    setGate({ s: "loading" });
    const { data, error } = await createClient().rpc("start_session");
    const r = data as SessionRes | null;
    if (error || !r) return setGate({ s: "error", msg: "Could not start your session. Please try again." });
    setGate(r.allowed ? { s: "active", sessionId: r.session_id, downloadUsed: r.download_used, remaining: r.remaining } : { s: "exhausted" });
  }
  useEffect(() => {
    if (!configured || !signedIn) return;
    (async () => {
      if (tier !== "free") return begin();
      const { data, error } = await createClient().rpc("get_quota");
      const q = data as { remaining: number; active: boolean } | null;
      if (error || !q) return setGate({ s: "error", msg: "Could not load your free sessions. Please try again." });
      if (q.active) return begin(); // resume an open session without using quota
      setGate(q.remaining > 0 ? { s: "idle", remaining: q.remaining } : { s: "exhausted" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, signedIn, tier]);

  if (!configured) return <Card><p className="text-sm text-muted">The account system is not configured on this server yet. Add the Supabase keys to your environment file.</p></Card>;
  if (!signedIn) return (
    <Card>
      <h2 className="font-display text-xl font-bold">Create a free account to start</h2>
      <p className="mt-2 text-sm text-muted">Every account gets 2 free photobooth sessions. No payment needed.</p>
      <div className="mt-5 flex flex-col gap-2"><ButtonLink href="/register?next=/studio">Create account</ButtonLink><ButtonLink href="/login?next=/studio" variant="outline">Log in</ButtonLink></div>
    </Card>
  );
  if (gate.s === "loading") return <p className="text-center text-sm text-muted" aria-live="polite">Loading…</p>;
  if (gate.s === "error") return <Card><p role="alert" className="text-sm">{gate.msg}</p><button type="button" onClick={() => void begin()} className="mt-4 rounded-full border border-line px-4 py-2 text-sm">Try again</button></Card>;
  if (gate.s === "idle") return (
    <Card>
      <p className="font-semibold">Your free sessions: {gate.remaining}/2 remaining.</p>
      <p className="mt-2 text-sm text-muted">One session: up to 3 photos, one finished strip and one JPG download.</p>
      <button type="button" onClick={() => void begin()} className="mt-5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg">Start session</button>
    </Card>
  );
  if (gate.s === "exhausted") return (
    <Card>
      <h2 className="font-display text-xl font-bold">You have enjoyed your free sessions!</h2>
      <p className="mt-2 text-sm text-muted">Unlock more creative possibilities with PHOTOBOOTH STUDIO.</p>
      <div className="mt-5 flex flex-col gap-2">
        <ButtonLink href="/upgrade?plan=standard">Upgrade to Standard</ButtonLink>
        <ButtonLink href="/upgrade?plan=premium" variant="outline">Explore Premium</ButtonLink>
        <ButtonLink href="/upgrade?plan=lifetime" variant="outline">Get Lifetime Access</ButtonLink>
      </div>
      <p className="mt-4 text-sm text-muted">You can still browse the <Link className="underline" href="/#filters">filters</Link>, <Link className="underline" href="/#templates">templates</Link> and <Link className="underline" href="/#pricing">plans</Link>.</p>
    </Card>
  );
  return <Studio tier={tier} sessionId={gate.sessionId} initialDownloadUsed={gate.downloadUsed} remaining={gate.remaining} />;
}

function Studio({ tier, sessionId, initialDownloadUsed, remaining }: { tier: Tier; sessionId: string | null; initialDownloadUsed: boolean; remaining: number | null }) {
  const [step, setStep] = useState<Step>("camera");
  const [shots, setShots] = useState<Shot[]>([]);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [downloadUsed, setDownloadUsed] = useState(initialDownloadUsed);
  const { edit, update, undo, redo, reset, canUndo, canRedo } = useEditHistory();
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  useEffect(() => {
    let live = true;
    Promise.all(shots.map((s) => loadImage(s.url))).then((i) => live && setImages(i)).catch(() => live && setImages([]));
    return () => { live = false; };
  }, [shots]);
  useEffect(() => () => shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url)), []);

  const hasShots = shots.length > 0;
  return (
    <div>
      {tier === "free" && remaining !== null && <p className="mb-4 text-center text-sm text-muted">Your free sessions: {remaining}/2 remaining.</p>}
      <div role="tablist" aria-label="Studio steps" className="mx-auto flex max-w-md justify-center gap-1 rounded-full border border-line p-1">
        {STEPS.map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={step === id} disabled={id !== "camera" && !hasShots} onClick={() => setStep(id)} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold disabled:opacity-40 ${step === id ? "bg-fg text-bg" : ""}`}>{label}</button>
        ))}
      </div>

      {step === "camera" && (
        <div className="mt-8">
          <CameraStudio shots={shots} setShots={setShots} />
          {hasShots && <div className="mt-6 text-center"><button type="button" onClick={() => setStep("look")} className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg">Continue to Look</button></div>}
        </div>
      )}

      {step !== "camera" && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PreviewCanvas edit={edit} images={images} selectedId={selected} onSelect={setSelected} onMove={(id, x, y) => update((e) => ({ layers: e.layers.map((l) => (l.id === id ? { ...l, x, y } : l)) }))} />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" className={tool} disabled={!canUndo} onClick={undo}>Undo</button>
              <button type="button" className={tool} disabled={!canRedo} onClick={redo}>Redo</button>
              <button type="button" className={tool} onClick={() => { reset(); setSelected(null); }}>Reset all</button>
            </div>
          </div>
          <div>
            {step === "look" && <LookPanel tier={tier} edit={edit} update={update} img={images[0]} />}
            {step === "layout" && <LayoutPanel tier={tier} edit={edit} update={update} />}
            {step === "finish" && <FinishPanel tier={tier} sessionId={sessionId} downloadUsed={downloadUsed} onDownloaded={() => setDownloadUsed(true)} edit={edit} update={update} images={images} selectedId={selected} setSelected={setSelected} />}
          </div>
        </div>
      )}
    </div>
  );
}
