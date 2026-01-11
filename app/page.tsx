"use client";
import Hero from "./components/Hero";
import Docs from "./components/Docs";       // The new "Classified Manual" component
import Refinery from "./components/UIRefine"; // Your existing "Live Demo"
import Playground from "./components/Playground";
import Footer from "./components/Footer";
import Features from "./components/Features";

export default function Home() {

  // The Handler: Smooth scrolls to the Docs section
  const handleScrollToDocs = () => {
    const docsSection = document.getElementById("docs-section");
    if (docsSection) {
      docsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-sky-500/30">

      {/* 1. HERO SECTION 
          - Passes the scroll handler to the "Read Documentation" button 
      */}
      <Hero onDocsClick={handleScrollToDocs} />

      <Features />

      {/* 2. DOCUMENTATION SECTION 
          - The "Classified Manual" we just built
          - Has the id="docs-section" for the scroll target
      */}
      <section id="docs-section" className="relative z-10 bg-black">
        <Docs />
      </section>

      {/* 3. LIVE PLAYGROUND (Refinery)
          - Kept as the final section for users who want to try it after reading
          - Added a separator line
      */}
      {/* <section id="refinery-section" className="relative z-10 border-t border-zinc-900 bg-black pt-20"> */}
      {/* <Refinery /> */}
      {/* </section> */}
      <Playground />


      <Footer />

    </main>
  );
}