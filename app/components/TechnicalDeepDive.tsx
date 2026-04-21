import { BookOpen, ExternalLink, Cpu, ShieldCheck } from "lucide-react";

const articles = [
  {
    title: "Orchestrating WebGPU: The Leader/Follower Mesh Pattern",
    platform: "Dev.to",
    description: "An architectural deep dive into managing shared GPU resources across multiple browser contexts.",
    link: "https://dev.to/rahulpanchal", // Replace with your link
    tag: "Architecture"
  },
  {
    title: "Zero-Latency Local AI in React Environments",
    platform: "Technical Blog",
    description: "Strategies for embedding SLM weights and optimizing inference speeds using hardware acceleration.",
    link: "https://dev.to/rahulpanchal", // Replace with your link
    tag: "Performance"
  }
];

export default function TechnicalDeepDives() {
  return (
    <section className="py-24 px-6 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <BookOpen className="text-sky-500 w-7 h-7" />
              Technical Deep Dives
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base leading-relaxed">
              Explore the engineering principles and research that power the React Brai runtime. 
              From WebGPU memory management to local inference security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article, i) => (
            <a 
              key={i} 
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-sky-500" />
              </div>
              
              <div>
                <span className="text-[10px] font-mono text-sky-500 uppercase tracking-widest block mb-4">
                  {article.tag} • {article.platform}
                </span>
                <h3 className="text-xl font-bold text-zinc-200 group-hover:text-white mb-3 tracking-tight">
                  {article.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {article.description}
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 uppercase">
                    <ShieldCheck className="w-3 h-3" /> Verified logic
                 </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}