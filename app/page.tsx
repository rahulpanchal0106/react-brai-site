"use client";
import Hero from "./components/Hero";
import Docs from "./components/Docs";       // The new "Classified Manual" component
import Refinery from "./components/UIRefine"; // Your existing "Live Demo"
import Playground from "./components/Playground";
import Footer from "./components/Footer";
import Features from "./components/Features";
import CommunityBuzz from "./components/CommunityBuzz";
import TechnicalDeepDives from "./components/TechnicalDeepDive";

export default function Home() {
  const handleScrollToDocs = () => {
    const docsSection = document.getElementById("docs-section");
    if (docsSection) docsSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-sky-500/30">
      <Hero onDocsClick={handleScrollToDocs} />
      {/* NEW: Trust & Authority Layer */}
      <section className="border-t border-zinc-900">
        <CommunityBuzz />
        {/* <TechnicalDeepDives /> */}
      </section>
      
      <Features />


      <section id="docs-section" className="relative z-10 bg-black">
        <Docs />
      </section>

      <Playground />
      <Footer />
    </main>
  );
}