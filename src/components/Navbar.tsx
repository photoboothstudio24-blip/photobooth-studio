"use client";
import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/data";
import { ButtonLink } from "./ui";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="font-display text-base font-extrabold tracking-tight" onClick={() => setOpen(false)}>
          PHOTOBOOTH STUDIO
        </Link>
        <ul className="hidden items-center gap-6 text-sm text-muted lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="hover:text-fg">{l.label}</Link></li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink href={signedIn ? "/account" : "/login"} variant="outline" className="hidden !py-2 sm:inline-flex">{signedIn ? "Account" : "Log in"}</ButtonLink>
          <ButtonLink href="/studio" className="hidden !py-2 sm:inline-flex">Start Photobooth</ButtonLink>
          <button type="button" className="rounded-full border border-line px-3 py-2 text-xs font-semibold lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-bg px-5 pb-5 lg:hidden">
          <ul className="flex flex-col py-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block py-3 text-base">{l.label}</Link></li>
            ))}
          </ul>
          <ButtonLink href="/studio" className="w-full">Start Photobooth</ButtonLink>
          <ButtonLink href={signedIn ? "/account" : "/login"} variant="outline" className="mt-2 w-full">{signedIn ? "Account" : "Log in"}</ButtonLink>
        </div>
      )}
    </header>
  );
}
