"use client";
import React, { useState, useEffect } from "react";
import { Copy, Check, Terminal, Zap, Book, Code, Database, FileJson, Shield, Share2, HardDrive, LayoutList, Activity } from "lucide-react";

// --- DATA: DOCS SECTIONS ---
const DOCS_SECTIONS = [
    { id: "intro", title: "Introduction", icon: Book },
    { id: "swarm", title: "Swarm Architecture", icon: Share2 },
    { id: "quickstart", title: "Quick Start", icon: Zap },
    { id: "patterns", title: "Core Patterns", icon: Code },
    { id: "api", title: "API Reference", icon: Terminal },
];

// --- COMPONENT: CODE BLOCK ---
const CodeBlock = ({ code, language = "typescript", label }: { code: string; language?: string, label?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-lg border border-zinc-800 bg-[#0a0a0a] overflow-hidden my-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                <div className="flex gap-2 items-center">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    </div>
                    {label && <span className="ml-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase">{language}</span>
                    <button
                        onClick={handleCopy}
                        className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-xs md:text-sm leading-relaxed text-zinc-300">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

// --- COMPONENT: API PROPERTY CARD ---
const PropCard = ({ name, type, desc, required = false, badge }: { name: string, type: string, desc: string, required?: boolean, badge?: string }) => (
    <div className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-lg hover:bg-zinc-900/30 transition-colors">
        <div className="flex items-center gap-3 mb-2">
            <code className="text-sm font-bold text-sky-400">{name}</code>
            {required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-medium uppercase">Required</span>}
            {badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium uppercase">{badge}</span>}
            <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-800/50">{type}</span>
        </div>
        <p className="text-sm text-zinc-400">{desc}</p>
    </div>
);

export default function Docs() {
    const [activeSection, setActiveSection] = useState("intro");
    const [version, setVersion] = useState("v2.1.0");

    useEffect(() => {
        fetch("https://registry.npmjs.org/react-brai/latest")
            .then((res) => res.json())
            .then((data) => { if (data.version) setVersion(`v${data.version}`); })
            .catch(() => { });
    }, []);

    // --- FIX: IMPROVED SCROLL SPY LOGIC ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.target.id) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: "-100px 0px -50% 0px",
                threshold: 0
            }
        );

        DOCS_SECTIONS.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <section className="relative min-h-screen w-full bg-black text-zinc-200 selection:bg-zinc-800 selection:text-white">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-plus-lighter" />

            <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-12 gap-12">

                {/* 1. STICKY SIDEBAR NAV */}
                <div className="hidden md:block md:col-span-3">
                    <div className="sticky top-24 space-y-1 border-l border-zinc-900 pl-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Documentation</h4>
                        {DOCS_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${activeSection === section.id
                                    ? "bg-zinc-900 text-white translate-x-2 border-r-2 border-white/10"
                                    : "text-zinc-500 hover:text-zinc-300 hover:translate-x-1"
                                    }`}
                            >
                                <section.icon className={`w-4 h-4 transition-colors ${activeSection === section.id ? "text-sky-500" : "opacity-50 group-hover:opacity-100"}`} />
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. MAIN CONTENT AREA */}
                <div className="md:col-span-9 space-y-32 pb-20">

                    {/* --- INTRO --- */}
                    <div id="intro" className="space-y-6 scroll-mt-24">
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-900/50 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                            <Terminal className="w-3 h-3" />
                            <span>{version} Stable</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Introduction</h2>
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl">
                            <strong className="text-white">react-brai</strong> is a fault-tolerant WebGPU runtime for React.
                            It creates a distributed "Swarm" across your user's open tabs, allowing them to share a single GPU context (VRAM) while executing requests in a persistent, recoverable queue.
                        </p>
                    </div>

                    {/* --- SWARM ARCHITECTURE --- */}
                    <div id="swarm" className="space-y-6 scroll-mt-24">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Share2 className="w-6 h-6 text-indigo-500" />
                            <h2 className="text-2xl font-bold text-white">The Swarm (v2)</h2>
                        </div>
                        <p className="text-zinc-400">
                            Browsers limit WebGPU to a single active context. To prevent crashes when users open multiple tabs,
                            <code>react-brai</code> uses a <strong>Leader Election</strong> system.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                                <h4 className="text-white font-bold flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-sky-500" /> Leader Tab
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    The first tab to open. It holds the GPU Lock and the loaded Model in VRAM. It processes the <strong>Job Queue</strong> sequentially.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                                <h4 className="text-white font-bold flex items-center gap-2 mb-2">
                                    <Share2 className="w-4 h-4 text-indigo-500" /> Follower Tabs
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Subsequent tabs. They do not load the model. Instead, they send requests to the Leader and listen for token streams.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-emerald-900/10 border border-emerald-900/30 mt-4">
                            <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-2 text-sm">
                                <HardDrive className="w-4 h-4" /> Persistent Recovery
                            </h4>
                            <p className="text-xs text-emerald-200/70 leading-relaxed">
                                If the <strong>Leader</strong> is closed or refreshed, the lock is released. The next Follower in line automatically promotes itself to Leader,
                                reads the <strong>Persistent Queue</strong> from LocalStorage, reloads the model, and resumes processing pending jobs.
                            </p>
                        </div>
                    </div>

                    {/* --- QUICK START --- */}
                    <div id="quickstart" className="space-y-6 scroll-mt-24">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Zap className="w-6 h-6 text-sky-500" />
                            <h2 className="text-2xl font-bold text-white">Quick Start</h2>
                        </div>
                        <p className="text-zinc-400">Initialize the engine. The hook automatically handles Leader/Follower negotiation.</p>
                        <CodeBlock
                            label="ChatComponent.tsx"
                            language="tsx"
                            code={`import { useLocalAI } from 'react-brai';

export default function Chat() {
  const { loadModel, chat, isReady, tps } = useLocalAI();

  useEffect(() => { 
      loadModel('Llama-3.2-1B-Instruct-q4f16_1-MLC'); 
  }, []);

  return <div>Speed: {tps} T/s</div>
}`}
                        />
                    </div>

                    {/* --- PATTERNS --- */}
                    <div id="patterns" className="space-y-12 scroll-mt-24">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Code className="w-6 h-6 text-violet-500" />
                            <h2 className="text-2xl font-bold text-white">Core Patterns</h2>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileJson className="w-5 h-5 text-sky-500" /> Structured Extraction
                            </h3>
                            <CodeBlock
                                label="extract.ts"
                                language="typescript"
                                code={`const response = await chat([
  { role: "system", content: "Output JSON: { sentiment: 'pos' | 'neg' }" },
  { role: "user", content: "I love this library!" }
]);
const data = JSON.parse(response);`}
                            />
                        </div>
                    </div>

                    {/* --- API REFERENCE --- */}
                    <div id="api" className="space-y-12 scroll-mt-24">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Terminal className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-2xl font-bold text-white">API Reference</h2>
                        </div>

                        {/* 1. useLocalAI() Hook */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white">useLocalAI()</h3>

                            {/* SWARM STATE */}
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-6 mb-3">Swarm State</h4>
                            <div className="grid gap-3">
                                <PropCard
                                    name="role"
                                    type="'LEADER' | 'FOLLOWER' | 'PENDING'"
                                    badge="Synced"
                                    desc="Current tab status. LEADERS perform inference. FOLLOWERS delegate to Leader."
                                />
                                <PropCard
                                    name="queue"
                                    type="QueueItem[]"
                                    badge="Synced"
                                    desc="Real-time list of all pending jobs across all tabs. Synced via LocalStorage."
                                />
                            </div>

                            {/* ENGINE STATE */}
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-8 mb-3">Engine State</h4>
                            <div className="grid gap-3">
                                <PropCard
                                    name="isReady"
                                    type="boolean"
                                    badge="Synced"
                                    desc="True when the Swarm Leader has a model loaded in VRAM."
                                />
                                <PropCard
                                    name="progress"
                                    type="{ progress: number, text: string }"
                                    badge="Synced"
                                    desc="Download progress (0-1). Visible to all tabs during initialization."
                                />
                                <PropCard
                                    name="isLoading"
                                    type="boolean"
                                    badge="Local"
                                    desc="True ONLY if *this specific tab* initiated the request currently being processed."
                                />
                                <PropCard
                                    name="response"
                                    type="string"
                                    badge="Local"
                                    desc="Streaming output buffer. Only populates for the tab that requested the chat."
                                />
                            </div>

                            {/* NEW: TELEMETRY */}
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-8 mb-3">Telemetry</h4>
                            <div className="grid gap-3">
                                <PropCard
                                    name="tps"
                                    type="number"
                                    badge="Real-time"
                                    desc="Tokens Per Second. Instantaneous inference speed metric."
                                />
                                <PropCard
                                    name="generatedTokens"
                                    type="number"
                                    badge="Real-time"
                                    desc="Total number of tokens generated for the current active response."
                                />
                            </div>

                            {/* METHODS */}
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-8 mb-3">Methods</h4>
                            <div className="grid gap-3">
                                <PropCard
                                    name="loadModel(modelId, config?)"
                                    type="void"
                                    desc="Requests the Leader to load a model. If Leader is busy/loaded, request is ignored safely."
                                    required
                                />
                                <PropCard
                                    name="unloadModel()"
                                    type="void"
                                    desc="Forces the Leader to purge the model from VRAM and terminate the worker to free memory."
                                />
                                <PropCard
                                    name="chat(messages)"
                                    type="void"
                                    desc="Push a job to the Swarm Queue. The promise resolves when tokens start streaming."
                                    required
                                />
                                <PropCard
                                    name="reset()"
                                    type="void"
                                    desc="Aborts the current job (if it belongs to this tab) and kills the Leader worker if necessary."
                                />
                            </div>
                        </div>

                        {/* 2. Type Definitions */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <LayoutList className="w-5 h-5 text-zinc-500" />
                                Type Definitions
                            </h3>
                            <CodeBlock
                                label="types.ts"
                                language="typescript"
                                code={`export interface LocalAIHook {
  role: 'LEADER' | 'FOLLOWER' | 'PENDING';
  isReady: boolean;
  isLoading: boolean;
  response: string;
  tps: number;              // 🆕 Telemetry
  generatedTokens: number;  // 🆕 Telemetry
  
  loadModel: (modelId: string, config?: ModelConfig) => void;
  unloadModel: () => void;  // 🆕 Method
  chat: (messages: Message[]) => void;
  reset: () => void;
}`}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}