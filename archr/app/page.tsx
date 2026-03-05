import About from "@/components/landing/about";
import DemoVideo from "@/components/landing/demo-video";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/howitwork";
import Waitlist from "@/components/landing/waitlist";
import Navbar from "@/components/landing/navbar";
import Feature from '@/components/landing/Feature';
import Benefits from '@/components/landing/Benefits';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Feature />
      <Benefits />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Waitlist />
    </main>
  );
}
