import About from "@/components/landing/about";
import DemoVideo from "@/components/landing/demo-video";
import Hero from "@/components/landing/hero";

export default function Home() {
  return (
    <main>
      <section className="relative min-h-screen overflow-hidden bg-[#060b1a] text-white">
        <Hero />
        <DemoVideo />
        <About />
      </section>
    </main>
  );
}
