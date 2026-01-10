"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Database, Cpu, AlertTriangle, CheckCircle2, Download, RefreshCw, Eraser, FileJson, MessageSquare, Loader2, Play, Copy, Trash2 } from "lucide-react";
import { useLocalAI } from "react-brai";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

// --- CONFIGURATION ---
const AVAILABLE_MODELS = [
    {
        id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        name: "Llama 3.2 1B",
        size: "1.2 GB",
        vram: "2GB",
        desc: "Fastest. Best for JSON extraction & simple chat.",
        recommended: true
    },
    {
        id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
        name: "Phi 3.5 Mini",
        size: "2.4 GB",
        vram: "4GB",
        desc: "High reasoning capabilities. Good for logic puzzles.",
        recommended: false
    },
    {
        id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
        name: "Mistral 7B",
        size: "4.8 GB",
        vram: "8GB",
        desc: "Heavy duty. Requires discrete GPU (RTX 3060+).",
        recommended: false
    }
];

const DEMO_APPS = [
    { id: "chat", name: "Chat", icon: MessageSquare, desc: "Standard conversational interface" },
    { id: "json", name: "JSON Refinery", icon: FileJson, desc: "Unstructured text to strict JSON" },
    { id: "redact", name: "PII Redactor", icon: Eraser, desc: "Remove sensitive data locally" },
];

export default function Playground() {
    const { loadModel, chat, isReady, isLoading, progress, response, reset } = useLocalAI();

    // UI State Management
    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
    const [activeApp, setActiveApp] = useState("chat");

    // Detailed Boot State to prevent "Flashing" on cache hits
    // IDLE -> LOADING -> SUCCESS (100% view) -> WORKSPACE
    const [bootState, setBootState] = useState<"IDLE" | "LOADING" | "SUCCESS" | "WORKSPACE">("IDLE");

    // Handle Boot
    const startEngine = () => {
        setBootState("LOADING");
        loadModel(selectedModel.id);
    };

    // Watch for Engine Readiness
    useEffect(() => {
        if (isReady && bootState === "LOADING") {
            // Force a "Success" state for 1 second so user sees the 100%
            setBootState("SUCCESS");
            setTimeout(() => {
                setBootState("WORKSPACE");
            }, 1000);
        }
    }, [isReady, bootState]);

    return (
        <div className="w-full min-h-[800px] bg-black border-t border-zinc-900 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4612_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4612_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">

                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-[10px] font-mono text-zinc-400 mb-4">
                        <Cpu className="w-3 h-3 text-sky-500" />
                        <span>Interactive Playground</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Test the Engine</h2>
                    <p className="text-zinc-500 max-w-2xl">
                        Select a model to load it into your browser's VRAM. This is a <strong className="text-zinc-200">live WebGPU instance</strong> running on your device.
                    </p>
                </div>

                {/* --- BOOTLOADER SCREEN (Visible during IDLE, LOADING, or SUCCESS) --- */}
                {bootState !== "WORKSPACE" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-3xl mx-auto bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                    >
                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Bootloader Config</span>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            </div>
                        </div>

                        <div className="p-8">
                            {bootState === "IDLE" ? (
                                <>
                                    <h3 className="text-lg font-bold text-white mb-6">Select Inference Model</h3>
                                    <div className="grid gap-4 mb-8">
                                        {AVAILABLE_MODELS.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => setSelectedModel(model)}
                                                className={`relative flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${selectedModel.id === model.id
                                                    ? "bg-zinc-900 border-sky-500/50 ring-1 ring-sky-500/20"
                                                    : "bg-black border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700"
                                                    }`}
                                            >
                                                <div className={`mt-1 p-2 rounded ${selectedModel.id === model.id ? "bg-sky-500/20 text-sky-400" : "bg-zinc-800 text-zinc-500"}`}>
                                                    <Database className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`font-bold ${selectedModel.id === model.id ? "text-white" : "text-zinc-400"}`}>{model.name}</span>
                                                        {model.recommended && <span className={`text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium ${selectedModel.id === model.id ? "mr-6" : ""}`}>RECOMMENDED</span>}
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mb-3">{model.desc}</p>
                                                    <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400">
                                                        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {model.size} Download</span>
                                                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> ~{model.vram} VRAM</span>
                                                    </div>
                                                </div>
                                                {selectedModel.id === model.id && (
                                                    <motion.div layoutId="check" className="absolute top-[17px] right-4 text-sky-500">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={startEngine}
                                        className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-white/10"
                                    >
                                        <Download className="w-4 h-4" />
                                        Initialize & Download Model
                                    </button>
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="mb-6 relative w-20 h-20 mx-auto flex items-center justify-center">
                                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                                            {/* Background Circle */}
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />

                                            {/* Progress Circle - Animated */}
                                            <motion.circle
                                                cx="50" cy="50" r="45" fill="none"
                                                stroke={bootState === "SUCCESS" ? "#10b981" : "#0ea5e9"}
                                                strokeWidth="8"
                                                strokeDasharray="283"
                                                // If SUCCESS, force to 100% (283 - 283 = 0 offset)
                                                // If LOADING, use progress or 5% minimum so it's visible
                                                animate={{
                                                    strokeDashoffset: bootState === "SUCCESS"
                                                        ? 0
                                                        : 283 - (283 * Math.max(0.05, progress?.progress || 0))
                                                }}
                                                transition={{ duration: 0.5 }}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className={`absolute text-sm font-mono font-bold ${bootState === "SUCCESS" ? "text-emerald-500" : "text-white"}`}>
                                            {bootState === "SUCCESS" ? "100%" : `${Math.round((progress?.progress || 0) * 100)}%`}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {bootState === "SUCCESS" ? "Engine Ready" : "Hydrating VRAM..."}
                                    </h3>

                                    <p className="text-zinc-500 text-sm max-w-sm mx-auto animate-pulse">
                                        {bootState === "SUCCESS"
                                            ? "Initializing app..."
                                            : (progress?.text || "Fetching weights...")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* --- ACTIVE WORKSPACE (Only visible when bootState is WORKSPACE) --- */}
                {bootState === "WORKSPACE" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-zinc-800 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl min-h-[600px]"
                    >
                        {/* SIDEBAR */}
                        <div className="lg:col-span-3 border-r border-zinc-800 bg-zinc-900/20 p-4 flex flex-col">
                            <div className="mb-8 px-2">
                                <div className="text-[10px] uppercase font-bold text-zinc-600 mb-2">Active Engine</div>
                                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {selectedModel.name}
                                </div>
                            </div>

                            <nav className="space-y-1 flex-1">
                                {DEMO_APPS.map((app) => (
                                    <button
                                        key={app.id}
                                        onClick={() => { setActiveApp(app.id); }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${activeApp === app.id
                                            ? "bg-zinc-800 text-white shadow-inner"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                            }`}
                                    >
                                        <app.icon className={`w-4 h-4 ${activeApp === app.id ? "text-sky-500" : "opacity-70"}`} />
                                        <div className="text-left">
                                            <div className="leading-none">{app.name}</div>
                                            <div className="text-[10px] font-normal opacity-60 mt-1">{app.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </nav>

                            <button
                                onClick={() => window.location.reload()}
                                className="mt-auto flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" /> Unload Model
                            </button>
                        </div>

                        {/* APP VIEW - PASSING PROPS DOWN */}
                        <div className="lg:col-span-9 bg-black/50 relative flex flex-col">
                            {activeApp === "chat" && <ChatApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                            {activeApp === "json" && <JsonApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                            {activeApp === "redact" && <RedactApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-APP: CHAT (LATCHING MODE)
const ChatApp = ({ chat, isLoading, streamBuffer }: any) => {
    // Helper: Get formatted ISO string
    const getTimestamp = () => new Date().toISOString();

    // Helper: Format for display (e.g. "10:30 AM")
    const formatTime = (isoString: string) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const STORAGE_KEY = "react-brai-chat-history";

    const DEFAULT_MSG = {
        role: "assistant",
        content: "Hello! I am running purely on your GPU. I can write code, lists, and format text.",
        timestamp: new Date().toISOString() // Initial Timestamp
    };

    // 1. LOAD HISTORY
    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                setMessages([DEFAULT_MSG]);
            }
        } else {
            setMessages([DEFAULT_MSG]);
        }
    }, []);

    // 2. AUTO-SAVE
    useEffect(() => {
        if (isMounted && messages.length > 0) {
            const cleanMessages = messages.filter(m => m.content !== "...");
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanMessages));
        }
    }, [messages, isMounted]);

    // 3. AUTO-FOCUS ON UNLOCK
    useEffect(() => {
        if (!isLoading && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 10);
        }
    }, [isLoading]);

    // AUTO-SCROLL
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamBuffer]);

    // AUTO-RESIZE INPUT
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // SYNC STREAM
    useEffect(() => {
        if (isLoading && streamBuffer) {
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.role === "assistant") {
                    return [...prev.slice(0, -1), { ...last, content: streamBuffer }];
                }
                return prev;
            });
        }
    }, [streamBuffer, isLoading]);

    // CONTEXT MANAGER
    const MAX_CONTEXT_CHARS = 8000;
    const trimHistory = (history: any[]) => {
        let currentChars = 0;
        const trimmed = [];
        for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i];
            const msgLen = msg.content.length;
            if (currentChars + msgLen < MAX_CONTEXT_CHARS) {
                trimmed.unshift(msg);
                currentChars += msgLen;
            } else {
                break;
            }
        }
        return [{ role: "system", content: "You are a helpful AI assistant." }, ...trimmed];
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const timestamp = getTimestamp();
        const userMsg = { role: "user", content: input, timestamp };
        const placeholderMsg = { role: "assistant", content: "...", timestamp }; // AI starts "thinking" now

        const newUIHistory = [...messages, userMsg];
        setMessages([...newUIHistory, placeholderMsg]);
        setInput("");

        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const contextToSend = trimHistory([...newUIHistory]);
        await chat(contextToSend);
    };

    const handleClear = () => {
        if (confirm("Clear conversation history?")) {
            localStorage.removeItem(STORAGE_KEY);
            setMessages([DEFAULT_MSG]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex flex-col h-full bg-[#050505] relative">

            <div className="absolute top-4 right-6 z-10">
                <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="p-2 bg-zinc-900/80 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded-lg border border-zinc-800 transition-colors backdrop-blur-sm"
                    title="Clear History"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm overflow-hidden ${m.role === "user"
                            ? "bg-sky-600 text-white rounded-br-none"
                            : "bg-zinc-800 text-zinc-200 rounded-bl-none"
                            }`}>
                            {m.content === "..." && isLoading ? (
                                <span className="animate-pulse flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-200" />
                                </span>
                            ) : (
                                <>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="relative group mt-2 mb-2 rounded-lg overflow-hidden border border-white/10">
                                                        <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5">
                                                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{match[1]}</span>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                                                className="text-zinc-500 hover:text-white transition-colors"
                                                                title="Copy Code"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            {...props}
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: 0, padding: '1rem', background: '#0a0a0a', fontSize: '12px' }}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code {...props} className="bg-black/20 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-inherit border border-white/10">
                                                        {children}
                                                    </code>
                                                )
                                            },
                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                            li: ({ children }) => <li className="pl-1">{children}</li>,
                                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 pb-1 border-b border-white/10">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
                                            blockquote: ({ children }) => <blockquote className="border-l-2 border-white/30 pl-3 italic opacity-80 my-2">{children}</blockquote>,
                                        }}
                                    >
                                        {m.content}
                                    </ReactMarkdown>

                                    {/* TIMESTAMP DISPLAY */}
                                    <div className={`text-[10px] mt-2 flex ${m.role === "user" ? "justify-end text-sky-200/50" : "justify-start text-zinc-500"}`}>
                                        {formatTime(m.timestamp)}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                <div className="flex gap-3 items-end bg-black border border-zinc-800 rounded-lg px-4 py-3 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message (Shift+Enter for new line)..."
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600 resize-none max-h-[200px] overflow-y-auto font-sans"
                        style={{ minHeight: '24px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-black p-1.5 rounded-lg flex items-center justify-center transition-all h-8 w-8"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
// ----------------------------------------------------------------------
// SUB-APP: JSON REFINERY
// ----------------------------------------------------------------------
const JsonApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [input, setInput] = useState("John Doe is a Senior Engineer with 5 years of experience in React and Node.js. Contact him at john@example.com.");
    const [output, setOutput] = useState<string>("");

    useEffect(() => {
        if (isLoading && streamBuffer) {
            setOutput(streamBuffer);
        }
    }, [streamBuffer, isLoading]);

    const handleExtract = async () => {
        if (isLoading) return;
        setOutput("");

        const msgs = [
            { role: "system", content: "You are a JSON extractor. Extract: name, role, skills (array), email. Return ONLY raw JSON." },
            { role: "user", content: input }
        ];
        await chat(msgs);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6"><h3 className="text-white font-bold">JSON Refinery</h3></div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none"
                />
                <div className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 font-mono text-sm text-emerald-400 overflow-auto">
                    <pre>{output || "// Waiting for extraction..."}</pre>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleExtract}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />} Extract Data
                </button>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// SUB-APP: PII REDACTOR
// ----------------------------------------------------------------------
const RedactApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [input, setInput] = useState("Meeting with Sarah Jones at 2pm. Email her at sarah.j@company.org regarding the Q3 budget.");
    const [output, setOutput] = useState("");

    useEffect(() => {
        if (isLoading && streamBuffer) {
            setOutput(streamBuffer);
        }
    }, [streamBuffer, isLoading]);

    const handleRedact = async () => {
        if (isLoading) return;
        setOutput("");
        const msgs = [
            { role: "system", content: "Redact all Names to [PERSON] and Emails to [EMAIL]. Return the redacted text only." },
            { role: "user", content: input }
        ];
        await chat(msgs);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6"><h3 className="text-white font-bold">PII Redactor</h3></div>
            <div className="space-y-6 flex-1">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-32 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none"
                />
                <div className="flex justify-center">
                    <button
                        onClick={handleRedact}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-6 py-2 rounded-full text-xs font-bold transition-all border border-zinc-700"
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />} Run Redaction Layer
                    </button>
                </div>
                <div className="w-full h-32 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400 font-mono leading-relaxed">
                    {output || <span className="opacity-30">// Redacted output...</span>}
                </div>
            </div>
        </div>
    );
};