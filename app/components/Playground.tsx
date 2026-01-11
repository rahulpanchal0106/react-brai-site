"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Terminal, Database, Cpu, AlertTriangle, CheckCircle2, Download,
    RefreshCw, Eraser, FileJson, MessageSquare, Loader2, Play, Copy,
    Trash2, Box, BrainCircuit, Sparkles, Zap, ChevronRight, Activity,
    RotateCcw, ListOrdered, Share2, Server, Clock,
    Search
} from "lucide-react";
import { useLocalAI } from "react-brai";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import ZincTooltip from "./ZincToolTip";
import { BraiLogo } from "./braiLogo";

// ============================================================================
// 1. HELPER COMPONENTS
// ============================================================================

const Sparkline = ({ data, color = "#0ea5e9" }: { data: number[], color?: string }) => {
    const safeData = data.length > 0 ? data : [0, 0];
    const max = Math.max(...safeData, 10);
    const min = 0;
    const points = safeData.map((val, i) => {
        const x = (i / (safeData.length - 1)) * 100;
        const y = 100 - ((val - min) / (max - min)) * 100;
        return `${x},${y}`;
    }).join(' ');
    return (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`M0,100 ${points.split(' ').map(p => 'L' + p).join(' ')} L100,100 Z`} fill="url(#gradient)" />
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

const ContextGauge = ({ stats, limit }: { stats: { active: number, total: number }, limit: number }) => {
    const percentage = Math.min((stats.active / limit) * 100, 100);
    const color = percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-emerald-500";
    return (
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
            <div className="flex flex-col items-end">
                <span className="text-zinc-300 font-bold">{stats.active} / {limit}</span>
                <span>Context Tokens</span>
            </div>
            <div className="h-8 w-2 bg-zinc-800 rounded-full overflow-hidden relative border border-zinc-700">
                <div className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${color}`} style={{ height: `${percentage}%` }} />
            </div>
        </div>
    );
};

// ============================================================================
// 2. CONFIG DATA
// ============================================================================

const AVAILABLE_MODELS = [
    // --- LIGHTWEIGHT (Mobile/Laptop Friendly) ---
    {
        id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        name: "Llama 3.2 1B",
        size: "1.2 GB",
        vram: "2GB",
        desc: "Fastest. Best for JSON & Chat."
    },
    {
        id: "gemma-2b-it-q4f16_1-MLC",
        name: "Gemma 2B",
        size: "1.4 GB",
        vram: "2.5GB",
        desc: "Google's efficient open model. Great instruction following."
    },
    {
        id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
        name: "Qwen 2.5 1.5B",
        size: "1.6 GB",
        vram: "3GB",
        desc: "Excellent reasoning for its size. Rivals larger models."
    },

    // --- MIDDLEWEIGHT (Good balance) ---
    {
        id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
        name: "Phi 3.5 Mini",
        size: "2.4 GB",
        vram: "4GB",
        desc: "High reasoning capabilities. Good for logic puzzles."
    },
    {
        id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
        name: "Llama 3.1 8B",
        size: "5.1 GB",
        vram: "6GB",
        desc: "The standard for accuracy. Requires 8GB+ RAM."
    },

    // --- HEAVYWEIGHT (Discrete GPU Required) ---
    {
        id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
        name: "Mistral 7B",
        size: "4.8 GB",
        vram: "8GB",
        desc: "Heavy duty. Uncensored-leaning. Requires discrete GPU."
    },
    {
        id: "gemma-2-9b-it-q4f16_1-MLC",
        name: "Gemma 2 9B",
        size: "6.2 GB",
        vram: "10GB",
        desc: "Very smart, but requires a high-end GPU (RTX 3080+)."
    }
];

const DEMO_APPS = [
    { id: "chat", name: "Chat", icon: MessageSquare },
    { id: "json", name: "JSON Refinery", icon: FileJson },
    { id: "redact", name: "PII Redactor", icon: Eraser },
];

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function Playground() {
    const hookData = useLocalAI();

    // Safety destructuring
    const {
        loadModel, chat, isReady = false, isLoading = false, progress, response, error,
        queue = [], role = "PENDING", tabId, tps
    } = hookData || {};

    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
    const [activeApp, setActiveApp] = useState("chat");
    const [tpsHistory, setTpsHistory] = useState(new Array(40).fill(0));

    const [bootState, setBootState] = useState<"IDLE" | "LOADING" | "ERROR" | "WORKSPACE">("IDLE");

    // 🆕 FIX: SYNC UI DROPDOWN WITH ACTUAL ENGINE STATE
    // This checks what the Leader (or previous session) loaded into VRAM
    useEffect(() => {
        const syncModelSelection = () => {
            try {
                const savedConfig = localStorage.getItem('brai_active_model_config');
                if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    const modelId = typeof config.model === 'string' ? config.model : config.model.model_id;

                    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
                    if (found) {
                        setSelectedModel(found);
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        syncModelSelection();

        // Also sync whenever we become ready (in case we just joined a session)
        if (isReady) syncModelSelection();
    }, [isReady]);

    const startEngine = () => {
        setBootState("LOADING");
        if (loadModel) loadModel(selectedModel.id, { contextWindow: 4096 });
    };

    useEffect(() => { if (isReady) setBootState("WORKSPACE"); }, [isReady]);
    useEffect(() => { if (error) setBootState("ERROR"); }, [error]);

    useEffect(() => {
        if (!tps) return;
        setTpsHistory(prev => {
            const next = [...prev.slice(1), tps];
            return next;
        });
    }, [tps]);

    useEffect(() => { setTpsHistory(prev => [...prev.slice(1), tps]); }, [tps]);

    return (
        <div id="playground" className="w-full min-h-[900px] bg-black border-t border-zinc-900 relative font-sans flex flex-col items-center py-24">

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4612_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4612_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* HEADER */}
            <div className="relative z-10 text-center mb-12 space-y-4 px-4">
                <ZincTooltip content="Distributes GPU load through a Leader-Follower architecture.">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono font-medium cursor-help">
                        {/* <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                        </span> */}
                        <BraiLogo width={12} height={12} />
                        BROWSER NATIVE SWARM
                    </div>
                </ZincTooltip>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-300 to-zinc-900 font-extrabold">
                        React Brai Playground
                    </span></h2>
                <p className="text-zinc-400 max-w-xl mx-auto">
                    Serverless AI, powered by your GPU.
                </p>
            </div>

            {/* MAIN INTERFACE GRID */}
            {/* MAIN INTERFACE GRID */}
            <div className="relative z-20 w-full max-w-6xl px-4 md:px-6">

                {/* FIX 1: "h-auto lg:h-[700px]" 
       - On Mobile: The height grows with content (no scroll trapping).
       - On Desktop: It locks to 700px for that dashboard look.
    */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[700px]">

                    {/* --- LEFT PANEL: CONFIG --- */}
                    {/* FIX 2: "h-auto lg:h-full" - Let it just be a normal list on mobile */}
                    <div className="lg:col-span-4 flex flex-col gap-6 h-auto lg:h-full overflow-visible lg:overflow-y-auto pr-1 order-2 lg:order-1">

                        {/* 1. CONFIG CARD */}
                        <div className="p-1 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-2xl shrink-0">
                            <div className="bg-black/90 backdrop-blur rounded-lg p-6 border border-white/5 space-y-6">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <Box className="w-5 h-5 text-sky-500" />
                                    Model Configuration
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-zinc-500 uppercase">Select Model</label>
                                        <select
                                            disabled={bootState !== "IDLE"}
                                            value={selectedModel.id}
                                            onChange={(e) => {
                                                const m = AVAILABLE_MODELS.find(x => x.id === e.target.value);
                                                if (m) setSelectedModel(m);
                                            }}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-sky-500 outline-none appearance-none disabled:opacity-50"
                                        >
                                            {AVAILABLE_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.size})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-2 items-start text-[10px] text-zinc-500 leading-relaxed">
                                        <div className="mt-0.5 min-w-[14px]">
                                            <Search className="w-3.5 h-3.5" />
                                        </div>
                                        <p>
                                            Looking for more? Find{" "}
                                            <a
                                                href="https://huggingface.co/models?search=q4f16_1-MLC"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-500 hover:text-sky-400 hover:underline transition-colors"
                                            >
                                                compatible models
                                            </a>
                                            {" "}on HuggingFace ending in{" "}
                                            <code className="bg-zinc-950 border border-zinc-800 px-1 py-0.5 rounded text-zinc-300 font-mono">
                                                q4f16_1-MLC
                                            </code>
                                        </p>
                                    </div>
                                    <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-zinc-400">VRAM Required</span>
                                            <span className="text-xs font-mono text-sky-400">{selectedModel.vram}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 leading-tight">{selectedModel.desc}</p>
                                    </div>
                                    <div className={`space-y-2 transition-opacity duration-500 ${bootState === "WORKSPACE" ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                                        <label className="text-xs font-medium text-zinc-500 uppercase">Active Application</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {DEMO_APPS.map((app) => (
                                                <button
                                                    key={app.id}
                                                    onClick={() => setActiveApp(app.id)}
                                                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-[10px] font-medium transition-all ${activeApp === app.id
                                                        ? "bg-zinc-800 border-zinc-600 text-white shadow-lg"
                                                        : "bg-transparent border-zinc-800 text-zinc-500 hover:bg-zinc-900"
                                                        }`}
                                                >
                                                    <app.icon className="w-4 h-4" />
                                                    {app.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. TELEMETRY */}
                        <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden shrink-0">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between text-zinc-300 font-bold text-sm">
                                    <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-sky-500" /> Telemetry</div>
                                    {role && role !== "PENDING" && (
                                        <ZincTooltip content={`This tab is opened as a ${role} of the swarm queue.`}>
                                            <div className={`text-[10px] uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${role === "LEADER" ? "bg-sky-500/10 text-sky-400 border-sky-500/30" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"}`}>
                                                {role === "LEADER" ? <Zap className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                                {role}
                                            </div>
                                        </ZincTooltip>
                                    )}
                                </div>
                                <div className="relative p-3 bg-black/50 rounded border border-zinc-800 overflow-hidden flex flex-col justify-between h-20">
                                    <Sparkline data={tpsHistory} color="#0ea5e9" />
                                    <div className="relative z-10 text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Speed</div>
                                    <div className="relative z-10 flex items-end gap-2">
                                        <div className="text-2xl font-mono text-white leading-none">{tps}</div>
                                        <span className="text-xs text-sky-400 font-mono mb-1">tokens per second</span>
                                    </div>
                                </div>
                                {/* Queue List */}
                                <div className="space-y-2 pt-2 border-t border-zinc-800">
                                    <div className="flex items-center justify-between text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                        <span>Job Queue</span>
                                        <span className="bg-zinc-800 px-1.5 rounded text-zinc-400">{queue.length}</span>
                                    </div>
                                    {queue.length === 0 && !isLoading && (
                                        <div className="text-center py-2 text-zinc-700 text-xs italic">Idle. Ready for requests.</div>
                                    )}
                                    {isLoading && (
                                        <div className="flex items-center gap-3 p-2 rounded bg-sky-500/10 border border-sky-500/20 animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-sky-400">Processing...</div>
                                            </div>
                                        </div>
                                    )}
                                    {queue.slice(0, 3).map((job: any, i: number) => (
                                        <div key={job.id} className="flex items-center gap-3 p-2 rounded bg-zinc-950/50 border border-zinc-800">
                                            <div className="text-zinc-600 text-xs font-mono w-4">#{i + 1}</div>
                                            <div className="flex-1">
                                                <div className="text-xs text-zinc-300 flex items-center gap-2">
                                                    {job.from === tabId ? <span className="text-emerald-400 font-bold">You</span> : <span className="text-indigo-400">Remote</span>}
                                                    <span className="text-[10px] text-zinc-600 ml-auto">Waiting</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {isReady && <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                                    <RefreshCw className="w-3 h-3" /> Unload & Reset
                                </button>}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT PANEL: WORKSPACE --- */}
                    {/* FIX 3: "h-[600px] lg:h-full" 
            - On Mobile: Force a 600px window so the Chat has room to exist.
            - On Desktop: Fill the remaining grid height.
        */}
                    <div className="lg:col-span-8 h-[600px] lg:h-full flex flex-col rounded-2xl border border-zinc-800 bg-black shadow-2xl overflow-hidden relative order-1 lg:order-2">
                        <div className="h-12 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 shrink-0">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                            </div>
                            <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                                {activeApp}

                                {role === "FOLLOWER" && (
                                    <ZincTooltip content="Connected to Swarm Leader. Delegating inference to save VRAM.">
                                        <span className="text-indigo-400 flex items-center gap-1 cursor-help">
                                            <Share2 className="w-3 h-3" /> Linked
                                        </span>
                                    </ZincTooltip>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {/* VIEW 1: IDLE */}
                            {bootState === "IDLE" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-6 p-8 text-center z-10">
                                    <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800">
                                        <BrainCircuit className="w-12 h-12 stroke-1 text-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-white text-lg font-bold">Ready to Initialize</h3>
                                        <p className="text-sm max-w-sm mx-auto">
                                            We need to download <strong>{selectedModel.size}</strong> of weights to your cache.
                                            This happens once.
                                        </p>
                                    </div>
                                    <button onClick={startEngine} className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105 flex items-center gap-2">
                                        <Download className="w-4 h-4" /> Download & Initialize
                                    </button>
                                </motion.div>
                            )}

                            {/* VIEW 2: LOADING */}
                            {bootState === "LOADING" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-12 z-20 bg-black/80 backdrop-blur-sm">
                                    <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-6" />
                                    <h3 className="text-white font-bold mb-2">Initializing WebGPU Engine</h3>
                                    <p className="text-zinc-500 text-sm mb-8 font-mono">{progress?.text || "Allocating VRAM..."}</p>
                                    <div className="w-full max-w-md h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-sky-500" initial={{ width: 0 }} animate={{ width: `${(progress?.progress || 0) * 100}%` }} transition={{ duration: 0.1 }} />
                                    </div>
                                    <div className="mt-2 text-xs text-zinc-600 font-mono text-right w-full max-w-md">{Math.round((progress?.progress || 0) * 100)}%</div>
                                </motion.div>
                            )}

                            {/* VIEW 3: ERROR */}
                            {bootState === "ERROR" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-12 z-20 bg-black/90 backdrop-blur-sm text-center">
                                    <div className="p-4 bg-red-500/10 rounded-full mb-6"><AlertTriangle className="w-10 h-10 text-red-500" /></div>
                                    <h3 className="text-white font-bold mb-2 text-xl">Initialization Failed</h3>
                                    <p className="text-zinc-400 text-sm mb-6 max-w-md">{error ? String(error) : "An unknown error occurred."}</p>
                                    <button onClick={() => setBootState("IDLE")} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2">
                                        <RotateCcw className="w-4 h-4" /> Retry
                                    </button>
                                </motion.div>
                            )}

                            {/* VIEW 4: WORKSPACE */}
                            {bootState === "WORKSPACE" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 bg-[#050505] overflow-hidden">
                                    {activeApp === "chat" && <ChatApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "json" && <JsonApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "redact" && <RedactApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                </motion.div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SUB-APP: CHAT (Updated to separate stream from history)
// ============================================================================
const ChatApp = ({ chat, isLoading, streamBuffer }: any) => {
    const activeStream = streamBuffer;

    const formatTime = (isoString: string) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const STORAGE_KEY = "react-brai-chat-history";

    const DEFAULT_MSG = {
        role: "assistant",
        content: "Hello! I am running purely on your GPU. I can write code, lists, and format text.",
        timestamp: new Date().toISOString()
    };

    // 1. Init History
    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        setMessages(saved ? JSON.parse(saved) : [DEFAULT_MSG]);
    }, []);

    // 2. Persist History
    useEffect(() => {
        if (isMounted && messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, isMounted]);

    // 3. Commit Stream to History when finished
    useEffect(() => {
        if (!isLoading && activeStream && activeStream.length > 0) {
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: activeStream, timestamp: new Date().toISOString() }
            ]);
        }
    }, [isLoading, activeStream]);

    // 4. Auto-Scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeStream, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: "user", content: input, timestamp: new Date().toISOString() };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput("");

        await chat(newHistory);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (!isMounted) return null;

    return (
        // FIX: Changed h-full to h-[600px] md:h-full
        // This forces a 600px height on mobile so it doesn't collapse, 
        // but fills the grid cell on desktop.
        <div className="flex flex-col h-[600px] md:h-full bg-[#050505] relative border-t md:border-t-0 border-zinc-800 overflow-y-scroll">

            {/* Trash Button */}
            <div className="absolute top-4 right-6 z-10">
                <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setMessages([DEFAULT_MSG]); }} className="p-2 bg-zinc-900/80 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded-lg border border-zinc-800 transition-colors backdrop-blur-sm">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Context Gauge (Desktop Only) */}
            <div className="absolute top-4 right-16 z-20 hidden md:block">
                <div className="bg-black/40 backdrop-blur border border-zinc-800 p-2 rounded-lg">
                    <ContextGauge stats={{ active: (messages.reduce((acc, m) => acc + m.content.length, 0) + (activeStream?.length || 0)), total: 4096 }} limit={4096} />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 space-y-6 overflow-y-scroll scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm overflow-hidden ${m.role === "user" ? "bg-sky-600 text-white rounded-br-none" : "bg-zinc-800 text-zinc-200 rounded-bl-none"}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                        <div className="relative group mt-2 mb-2 rounded-lg overflow-hidden border border-white/10">
                                            <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5">
                                                <span className="text-[10px] font-mono text-zinc-400 uppercase">{match[1]}</span>
                                                <button onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))} className="text-zinc-500 hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                                            </div>
                                            <SyntaxHighlighter {...props} style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1rem', background: '#0a0a0a', fontSize: '12px' }}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                                        </div>
                                    ) : <code {...props} className="bg-black/20 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-inherit border border-white/10">{children}</code>
                                }
                            }}>{m.content}</ReactMarkdown>
                            <div className={`text-[10px] mt-2 flex ${m.role === "user" ? "justify-end text-sky-200/50" : "justify-start text-zinc-500"}`}>{formatTime(m.timestamp)}</div>
                        </div>
                    </div>
                ))}

                {/* Stream Bubble */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[90%] md:max-w-[80%] rounded-2xl rounded-bl-none px-5 py-3.5 text-sm leading-relaxed shadow-sm bg-zinc-800 text-zinc-200">
                            {(!activeStream || activeStream.length === 0) ? (
                                <span className="animate-pulse flex gap-1 items-center py-1">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-200" />
                                </span>
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeStream}</ReactMarkdown>
                            )}
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 z-99">
                <div className="flex gap-3 items-end bg-black border border-zinc-800 rounded-lg px-4 py-3 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600 resize-none max-h-[120px] overflow-y-auto font-sans py-1"
                        style={{ minHeight: '24px' }}
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-black p-1.5 rounded-lg flex items-center justify-center transition-all h-8 w-8 shrink-0">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SUB-APP: JSON REFINERY
// ============================================================================
const JsonApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [input, setInput] = useState("John Doe is a Senior Engineer with 5 years of experience. Contact: john@example.com");
    const [output, setOutput] = useState("");
    useEffect(() => { if (isLoading && streamBuffer) setOutput(streamBuffer); }, [streamBuffer, isLoading]);

    const handleExtract = async () => {
        if (isLoading) return;
        setOutput("");
        await chat([
            { role: "system", content: "Extract to JSON: name, role, email. Output JSON only." },
            { role: "user", content: input }
        ]);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6"><h3 className="text-white font-bold">JSON Refinery</h3></div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none" />
                <div className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 font-mono text-sm text-emerald-400 overflow-auto">
                    <pre>{output || "// Waiting..."}</pre>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleExtract} disabled={isLoading} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />} Extract Data
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// SUB-APP: PII REDACTOR
// ============================================================================
const RedactApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [input, setInput] = useState("Meeting with Sarah Jones at 2pm. Email her at sarah.j@company.org.");
    const [output, setOutput] = useState("");
    useEffect(() => { if (isLoading && streamBuffer) setOutput(streamBuffer); }, [streamBuffer, isLoading]);

    const handleRedact = async () => {
        if (isLoading) return;
        setOutput("");
        await chat([
            { role: "system", content: "Redact names to [PERSON] and emails to [EMAIL]." },
            { role: "user", content: input }
        ]);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6"><h3 className="text-white font-bold">PII Redactor</h3></div>
            <div className="space-y-6 flex-1">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-32 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none" />
                <div className="flex justify-center">
                    <button onClick={handleRedact} disabled={isLoading} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-6 py-2 rounded-full text-xs font-bold transition-all border border-zinc-700">
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />} Run Redaction
                    </button>
                </div>
                <div className="w-full h-32 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400 font-mono leading-relaxed">
                    {output || <span className="opacity-30">// Redacted output...</span>}
                </div>
            </div>
        </div>
    );
};