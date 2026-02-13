import About from "@/components/landing/about";
import DemoVideo from "@/components/landing/demo-video";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/howitwork";
import Waitlist from "@/components/landing/waitlist";

export default function Home() {
  return (
    <main>
      <section className="relative min-h-screen overflow-hidden bg-black text-white">
        <Hero />
        <DemoVideo />
        <About />
        <div className="relative text-white">
          <HowItWorks />
        </div>
        <Waitlist
        
        />
      </section>
      <Footer />
    </main>
  );
}
