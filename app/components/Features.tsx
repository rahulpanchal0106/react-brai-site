"use client";
import React from "react";
import { Shield, Zap, Share2, DollarSign, Lock, Cpu } from "lucide-react";

const features = [
    {
        icon: DollarSign,
        title: "Slash Cloud Costs", // Honest: "Slash" vs "Eliminate"
        desc: "Don't pay per-token for every simple task. Offload routine jobs like summarization and JSON extraction to the client, saving your API budget for complex reasoning."
    },
    {
        icon: Share2,
        title: "Crash-Proof Swarm", // Benefit-driven (was "Tab Swarm Architecture")
        desc: "Browsers limit WebGPU to one active context. Our Leader Election system synchronizes state across tabs to prevent crashes."
    },
    {
        icon: Shield,
        title: "Total Data Privacy",
        desc: "Inputs never leave the client's device. Perfect for HIPAA-compliant healthcare apps, legal tech, and PII redaction."
    },
    {
        icon: Zap,
        title: "Zero-Latency Inference",
        desc: "Remove network round-trips entirely. Once the model loads, text generation is instantaneous and works fully offline."
    },
    {
        icon: Lock,
        title: "Production-Grade DX", // Benefit-driven (was "Type-Safe API")
        desc: "Built for serious development. Full TypeScript support, Zod schema validation, and strict state management out of the box."
    },
    {
        icon: Cpu,
        title: "Native Metal & Vulkan", // Benefit-driven (was "Powered by WebLLM")
        desc: "We bypass standard WebGL to access raw compute shaders via WebGPU, unlocking near-native performance on Apple M-Series and NVIDIA cards."
    }
];

export default function Features() {
    return (
        <section className="py-24 bg-black border-t border-zinc-900 relative overflow-hidden border-b border-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-zinc-800/30 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">

                        {/* Updated Header: "The React Brai Advantage"
                           This accurately introduces both the general "Edge" benefits AND 
                           the specific features of your library.
                        */}
                        <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-300 to-zinc-900 font-extrabold">
                            React Brai Features
                        </span>
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        A complete runtime for distributed, privacy-first AI on a React app.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="group p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:bg-zinc-900/40 hover:border-zinc-700 transition-all">
                            <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <f.icon className="w-6 h-6 text-zinc-300" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}