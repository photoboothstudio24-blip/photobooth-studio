import { FAQS, FEATURES, HOW_IT_WORKS, PLANS } from "@/lib/data";
import { ButtonLink, Section } from "./ui";
import FilterShowcase from "./FilterShowcase";
import TemplateShowcase from "./TemplateShowcase";

const rupiah = (n: number) => (n === 0 ? "Rp0" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n));

export function Features() {
  return (
    <Section id="features" title="Everything a photobooth does, in your browser." intro="PHOTOBOOTH STUDIO is being built in stages. The features below are the plan, and each one is added only when it really works.">
      <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="border-t border-fg pt-4">
            <h3 className="font-display text-lg font-bold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Filters() {
  return (
    <Section id="filters" title="Find your look." intro="Pick a category, choose a filter and slide the intensity. This preview is live.">
      <FilterShowcase />
    </Section>
  );
}

export function Templates() {
  return (
    <Section id="templates" title="Templates for every occasion." intro="Strips, polaroids and collages for birthdays, weddings, graduations and more. Previews below use demo illustrations.">
      <TemplateShowcase />
    </Section>
  );
}

export function HowItWorks() {
  return (
    <Section id="how-it-works" title="From camera to download in four steps.">
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((s, i) => (
          <li key={s.title}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-flash font-display font-bold text-neutral-900">{i + 1}</span>
            <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Pricing() {
  return (
    <Section id="pricing" title="Pay once. Keep it." intro="No monthly or yearly fees. Start with two free sessions, upgrade only if you want more.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <article key={p.id} className="flex flex-col rounded-2xl border border-line bg-card p-6">
            <h3 className="font-display text-sm font-bold tracking-tight">{p.name}</h3>
            <p className="mt-3 font-display text-3xl font-extrabold">{rupiah(p.price)}</p>
            <p className="mt-1 text-sm text-muted">{p.price === 0 ? "Free" : "One-time payment, lifetime access"}</p>
            <p className="mt-3 text-sm">{p.tagline}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-muted">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span aria-hidden="true" className="text-accent">+</span><span>{f}</span></li>
              ))}
            </ul>
            <div className="mt-6">
              <ButtonLink href={p.id === "free" ? "/studio" : `/upgrade?plan=${p.id}`} variant={p.id === "free" ? "primary" : "outline"} className="w-full">{p.cta}</ButtonLink>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
        Already have a plan? You pay only the difference: Standard to Premium {rupiah(10000)}, Standard to Lifetime {rupiah(40000)}, Premium to Lifetime {rupiah(30000)}. Pay by bank transfer or GoPay, then upload your proof. Your plan activates after we confirm the payment.
      </p>
    </Section>
  );
}

export function Faq() {
  return (
    <Section id="faq" title="Questions, answered.">
      <div className="max-w-3xl divide-y divide-line border-y border-line">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {f.q}
              <span aria-hidden="true" className="text-xl text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
