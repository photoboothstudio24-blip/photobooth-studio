import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
const base =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
const styles: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  outline: "border border-line text-fg hover:bg-fg/5",
  ghost: "text-fg hover:bg-fg/5",
};

export function ButtonLink({ href, variant = "primary", children, className = "" }: { href: string; variant?: Variant; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function DisabledButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" disabled className={`${base} cursor-not-allowed border border-line text-muted ${className}`}>
      {children}
    </button>
  );
}

export function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
      <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {intro && <p className="mt-3 max-w-xl leading-relaxed text-muted">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}
