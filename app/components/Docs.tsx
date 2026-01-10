"use client";
import React, { useState, useEffect } from "react";
import { Copy, Check, Terminal, Cpu, Shield, Zap, Book, ChevronRight, Code, Database, FileJson, EyeOff, LayoutList } from "lucide-react";

// --- DATA: DOCS SECTIONS ---
const DOCS_SECTIONS = [
    { id: "intro", title: "Introduction", icon: Book },
    { id: "quickstart", title: "Quick Start", icon: Zap },
    { id: "patterns", title: "Core Patterns", icon: Code },
    { id: "api", title: "API Reference", icon: Terminal }, // NOW EXPANDED
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
const PropCard = ({ name, type, desc, required = false }: { name: string, type: string, desc: string, required?: boolean }) => (
    <div className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-lg hover:bg-zinc-900/30 transition-colors">
        <div className="flex items-center gap-3 mb-2">
            <code className="text-sm font-bold text-sky-400">{name}</code>
            {required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-medium uppercase">Required</span>}
            <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-800/50">{type}</span>
        </div>
        <p className="text-sm text-zinc-400">{desc}</p>
    </div>
);

export default function Docs() {
    const [activeSection, setActiveSection] = useState("intro");
    const [version, setVersion] = useState("v1.0.0");

    useEffect(() => {
        fetch("https://registry.npmjs.org/react-brai/latest")
            .then((res) => res.json())
            .then((data) => { if (data.version) setVersion(`v${data.version}`); })
            .catch(() => { });
    }, []);


    // --- SCROLL SPY LOGIC ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: "-20% 0px -60% 0px",
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
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
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
                                    ? "bg-zinc-900 text-white translate-x-2"
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
                    <div id="intro" className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-900/50 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                            <Terminal className="w-3 h-3" />
                            <span>{version} Stable</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Introduction</h2>
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl">
                            <a
                                href="https://www.npmjs.com/package/react-brai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-xs font-mono text-zinc-400 mb-6 sm:mb-8 shadow-lg hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
                            ><strong className="text-white">react-brai</strong></a> is a drop-in runtime for "Local Intelligence."
                            It allows you to run quantized LLMs (Llama-3, Phi-3, Mistral) directly inside the browser using WebGPU.
                        </p>
                    </div>

                    {/* --- QUICK START --- */}
                    <div id="quickstart" className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Zap className="w-6 h-6 text-sky-500" />
                            <h2 className="text-2xl font-bold text-white">Quick Start</h2>
                        </div>
                        <p className="text-zinc-400">Initialize the engine and bind it to your UI.</p>
                        <CodeBlock
                            label="Basic Implementation"
                            language="tsx"
                            code={`import { useLocalAI } from 'react-brai';

export default function Chat() {
  const { loadModel, chat, isReady } = useLocalAI();

  useEffect(() => { loadModel('Llama-3.2-1B-Instruct-q4f16_1-MLC'); }, []);

  const handleSend = async () => {
    const response = await chat("Explain quantum physics");
    console.log(response);
  };
}`}
                        />
                    </div>

                    {/* --- CORE PATTERNS --- */}
                    <div id="patterns" className="space-y-12">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Code className="w-6 h-6 text-violet-500" />
                            <h2 className="text-2xl font-bold text-white">Core Patterns</h2>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileJson className="w-5 h-5 text-zinc-500" /> Pattern 1: Structured Extraction
                            </h3>
                            <CodeBlock
                                label="extract-json.ts"
                                language="typescript"
                                code={`// Force JSON output via System Prompt
const response = await chat([
  { role: "system", content: "Output valid JSON only. Schema: { name: string }" },
  { role: "user", content: "Extract name from: My name is Alice." }
]);
const data = JSON.parse(response);`}
                            />
                        </div>
                    </div>

                    {/* --- API REFERENCE (EXPANDED) --- */}
                    <div id="api" className="space-y-12">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Terminal className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-2xl font-bold text-white">API Reference</h2>
                        </div>

                        {/* 1. useLocalAI() Hook */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white">useLocalAI()</h3>
                            <p className="text-sm text-zinc-400">The main hook that initializes the WebWorker and WebGPU engine.</p>

                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-6 mb-3">Return Values</h4>
                            <div className="grid gap-3">
                                <PropCard
                                    name="isReady"
                                    type="boolean"
                                    desc="True when the model has finished downloading and compiling shaders. Ready for inference."
                                />
                                <PropCard
                                    name="isLoading"
                                    type="boolean"
                                    desc="True while the engine is generating tokens (inference in progress)."
                                />
                                <PropCard
                                    name="progress"
                                    type="{ progress: number, text: string }"
                                    desc="Real-time download status. 'progress' is 0-1. 'text' describes the current step (e.g., 'Fetching params...')."
                                />
                                <PropCard
                                    name="error"
                                    type="string | null"
                                    desc="Contains any errors from the worker thread (e.g., 'WebGPU not supported')."
                                />
                                <PropCard
                                    name="response"
                                    type="string"
                                    desc="The current streaming output buffer. Updates in real-time as tokens are generated."
                                />
                            </div>

                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-8 mb-3">Methods</h4>
                            <div className="grid gap-3">
                                <PropCard
                                    name="loadModel(modelId, config?)"
                                    type="Promise<void>"
                                    desc="Initializes the engine. triggers download. See ModelConfig below."
                                    required
                                />
                                <PropCard
                                    name="chat(messages, options?)"
                                    type="Promise<string>"
                                    desc="Sends a prompt to the model. Returns the full final text when complete."
                                    required
                                />
                                {/* <PropCard
                                    name="interrupt()"
                                    type="void"
                                    desc="Immediately stops the current generation cycle."
                                />
                                <PropCard
                                    name="reset()"
                                    type="void"
                                    desc="Clears the chat history context window."
                                /> */}
                            </div>
                        </div>

                        {/* 2. Type Definitions */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <LayoutList className="w-5 h-5 text-zinc-500" />
                                Type Definitions
                            </h3>
                            <p className="text-sm text-zinc-400">Copy these interfaces into your project's types file.</p>

                            <CodeBlock
                                label="types.ts"
                                language="typescript"
                                code={`export interface ModelConfig {
  top_p?: number;           // Default: 0.9. Nucleus sampling.
  max_tokens?: number;      // Default: 1024. Limit output length.
  context_window?: number;  // Default: 2048. Max input tokens.
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface InitProgress {
  progress: number; // 0.0 to 1.0
  text: string;     // e.g. "Loading model weights..."
}

export interface LocalAIHook {
  isReady: boolean;
  isLoading: boolean;
  progress: InitProgress | null;
  error: string | null;
  response: string; // Streaming buffer
  
  loadModel: (modelId: string, config?: ModelConfig) => Promise<void>;
  chat: (messages: Message[] | string, options?: ModelConfig) => Promise<string>;
}`}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}