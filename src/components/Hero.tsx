"use client";
import { motion, useReducedMotion } from "framer-motion";
import DemoPhoto from "./DemoPhoto";
import { ButtonLink } from "./ui";

const STRIP = [
  { hue: 330, filter: "none" },
  { hue: 200, filter: "grayscale(1) contrast(1.1)" },
  { hue: 40, filter: "sepia(.35) saturate(1.3)" },
  { hue: 280, filter: "saturate(1.7) hue-rotate(10deg)" },
];

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
      <div>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Capture Your Moments. Create Your Memories.
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
          An online photobooth experience to capture, customize, and create beautiful memories — anytime, anywhere.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/studio">Start Photobooth</ButtonLink>
          <ButtonLink href="/#templates" variant="outline">Explore Templates</ButtonLink>
          <ButtonLink href="/#pricing" variant="ghost">View Pricing</ButtonLink>
        </div>
        <p className="mt-6 text-sm text-muted">No install. Photos stay on your device. Every account gets 2 free sessions.</p>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm justify-center pb-4" aria-hidden="true">
        <div className="relative w-52">
          <div className="relative z-10 h-5 rounded-full bg-fg shadow-md" />
          <motion.div
            initial={reduce ? false : { y: -300 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative mx-3 -mt-2 flex flex-col gap-2 rounded-b-sm bg-white p-2.5 pt-4 shadow-xl ring-1 ring-black/10"
          >
            {STRIP.map((s) => (
              <div key={s.hue} className="aspect-[4/3] overflow-hidden rounded-[3px]">
                <DemoPhoto hue={s.hue} className="h-full w-full" style={{ filter: s.filter }} />
              </div>
            ))}
            <p className="pt-1 text-center font-display text-[10px] font-bold tracking-tight text-neutral-800">PHOTOBOOTH STUDIO</p>
          </motion.div>
        </div>
        <div className="absolute -right-2 bottom-0 hidden w-32 rotate-6 rounded-sm bg-white p-2 pb-6 shadow-xl ring-1 ring-black/10 sm:block">
          <div className="aspect-square overflow-hidden"><DemoPhoto hue={10} className="h-full w-full" style={{ filter: "contrast(.95) brightness(1.1) sepia(.2)" }} /></div>
        </div>
        <div className="absolute -left-1 top-10 h-4 w-4 rounded-full bg-flash" />
      </div>
    </section>
  );
}
