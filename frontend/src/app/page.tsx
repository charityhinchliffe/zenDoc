import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { SecurityLayers } from "@/components/SecurityLayers";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <a className="skip" href="#how">
        Skip to how it works
      </a>
      <main>
        <Hero />
        <HowItWorks />
        <SecurityLayers />
      </main>
      <SiteFooter />
    </>
  );
}
