import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

export default function Home() {
  return (
    <main className="relative bg-black min-h-screen">
      <Navigation />
      <Hero />
      <Features />
    </main>
  );
}
