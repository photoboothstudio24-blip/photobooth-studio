import Hero from "@/components/Hero";
import { Faq, Features, Filters, HowItWorks, Pricing, Templates } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Filters />
      <Templates />
      <HowItWorks />
      <Pricing />
      <Faq />
    </>
  );
}
