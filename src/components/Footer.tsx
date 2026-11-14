import Link from "next/link";
import { NAV_LINKS } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="font-display text-base font-extrabold tracking-tight">PHOTOBOOTH STUDIO</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Photos are processed in your browser and stay on your device unless you choose to share them.</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm text-muted">
          {NAV_LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="hover:text-fg">{l.label}</Link></li>
          ))}
          <li><Link href="/studio" className="hover:text-fg">Start Photobooth</Link></li>
        </ul>
      </div>
      <p className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} PHOTOBOOTH STUDIO</p>
    </footer>
  );
}
