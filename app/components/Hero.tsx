"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { BookOpen, Database, Cpu, Box, Sparkles, Zap, BrainCircuit, FileJson, ShieldAlert, Search, Eraser, PenTool, Layers, LayoutTemplate, Copy, Check, Play } from "lucide-react";
import ZincTooltip from "./ZincToolTip";

// --- TOP ROW: THE POWER (Models) ---
const MODELS_SQUAD = [
    { icon: BrainCircuit, text: "Llama-3.2-1B", color: "text-white" },
    { icon: Sparkles, text: "Gemma-2-2B", color: "text-zinc-300" },
    { icon: Zap, text: "Phi-3.5-Mini", color: "text-zinc-400" },
    { icon: Box, text: "Qwen-2.5-1.5B", color: "text-zinc-500" },
    { icon: Layers, text: "Mistral-7B-v0.3", color: "text-white" },
    { icon: LayoutTemplate, text: "Llama-3.1-8B", color: "text-zinc-300" },
];

const PROBLEM_SOLVERS = [
    { icon: FileJson, text: "JSON Extraction", color: "text-sky-200" },
    { icon: Eraser, text: "PII Redaction", color: "text-zinc-300" },
    { icon: Search, text: "Semantic Search", color: "text-white" },
    { icon: ShieldAlert, text: "Mod & Safety", color: "text-slate-400" },
    { icon: PenTool, text: "Smart Form Fill", color: "text-sky-100" },
];

// --- THE NEW LOGO COMPONENT ---
const BraiLogo = ({ className = "w-8 h-8", color = "#808485ff" }: { className?: string, color?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke={color} strokeWidth="3" strokeLinecap="round">
            <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(45 32 32)" />
            <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(135 32 32)" />
            <path d="M4 32H60" />
        </g>
    </svg>
);

const Marquee = ({ items, direction = "left", speed = 20 }: { items: any[], direction?: "left" | "right", speed?: number }) => {
    return (
        <div className="flex overflow-hidden w-full relative z-0 pointer-events-none opacity-100 transition-opacity duration-500 [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
            <motion.div
                initial={{ x: direction === "left" ? 0 : "-50%" }}
                animate={{ x: direction === "left" ? "-50%" : 0 }}
                transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
                className="flex gap-4 sm:gap-8 flex-shrink-0 py-2 sm:py-4"
            >
                {[...items, ...items, ...items, ...items].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-zinc-950 border border-zinc-800 rounded-full whitespace-nowrap shadow-xl">
                        <item.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${item.color}`} />
                        <span className="text-xs sm:text-sm font-medium text-zinc-300">{item.text}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default function Hero({ onDocsClick }: { onDocsClick: () => void }) {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end start"] });
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const [version, setVersion] = useState("v1.0.0");
    const [copied, setCopied] = useState(false);

    // --- GPU DETECTION LOGIC ---
    const [gpuStatus, setGpuStatus] = useState<{
        state: "CHECKING" | "READY" | "UNSUPPORTED";
        name: string;
    }>({ state: "CHECKING", name: "Analyzing Hardware..." });

    useEffect(() => {
        const checkGPU = async () => {
            if (!(navigator as any).gpu) {
                setGpuStatus({ state: "UNSUPPORTED", name: "WebGPU Not Available" });
                return;
            }
            try {
                const adapter = await (navigator as any).gpu.requestAdapter();
                if (!adapter) {
                    setGpuStatus({ state: "UNSUPPORTED", name: "No Graphics Adapter" });
                    return;
                }
                const info = (adapter).info || (await (adapter).requestAdapterInfo?.());
                let gpuName = "High-Performance GPU";
                if (info) {
                    if (info.device && info.device !== "") {
                        gpuName = info.device;
                    } else if (info.vendor) {
                        const vendor = info.vendor.toUpperCase();
                        const arch = info.architecture ? info.architecture.toUpperCase() : "GPU";
                        gpuName = `${vendor} ${arch}`;
                    }
                }
                setGpuStatus({ state: "READY", name: gpuName });
            } catch (e) {
                console.error(e);
                setGpuStatus({ state: "UNSUPPORTED", name: "Hardware Error" });
            }
        };
        checkGPU();
    }, []);

    useEffect(() => {
        fetch("https://registry.npmjs.org/react-brai/latest")
            .then((res) => res.json())
            .then((data) => { if (data.version) setVersion(`v${data.version}`); })
            .catch(() => { });
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText("npm install react-brai");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleScrollToPlayground = () => {
        const element = document.getElementById("playground");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section ref={targetRef} className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-black text-white selection:bg-zinc-500/30 py-20 sm:py-0">
            {/* 1. BACKGROUND LAYERS */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-[80vh] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[size:300px_300px] opacity-40 mix-blend-overlay [mask-image:radial-gradient(ellipse_80%_60%_at_50%_-20%,black,transparent)]" />
                <div className="absolute top-0 left-0 right-0 h-[80vh] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,255,255,0.12),rgba(0,0,0,0))]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[size:300px_300px] opacity-[0.03] mix-blend-plus-lighter" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4612_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4612_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20" />
            </div>

            {/* 2. MAIN CONTENT */}
            <motion.div style={{ scale, opacity }} className="relative z-20 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center">

                {/* Badge */}
                <a
                    href="https://www.npmjs.com/package/react-brai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-xs font-mono text-zinc-400 mb-6 sm:mb-8 shadow-lg hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                    <div className="text-zinc-300 group-hover:scale-110 transition-transform duration-300">
                        <BraiLogo className="w-5 h-5" color="currentColor" />
                    </div>
                    <span className="flex items-center gap-1.5">
                        <span className="font-bold text-white tracking-tight">react-brai</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        <span className="opacity-70">{version} Stable</span>
                    </span>
                </a>

                <h1 className="relative text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-center text-white mb-6 sm:mb-8">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 pointer-events-none opacity-10">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full text-white flex items-center justify-center opacity-30"
                        >
                            <BraiLogo className="w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96" />
                        </motion.div>
                    </div>

                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-600">The Runtime for</span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-500 to-zinc-900 drop-shadow-2xl">Edge AI in React</span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-zinc-500 text-center max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed">
                    Run privacy-first small AI without the infrastructure overhead.
                    <br className="hidden sm:block" />
                    <span className="text-zinc-300 font-medium block sm:inline mt-2 sm:mt-0">Zero Latency. Zero Cost. Easy To Use.</span>
                </p>

                {/* --- BUTTONS (UPDATED FOR ZINC THEME) --- */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-12 sm:mb-16 w-full justify-center items-center max-w-xs sm:max-w-none flex-wrap">

                    {/* 1. PRIMARY: TRY DEMO (Zinc-100 / High Contrast) */}
                    <button
                        onClick={handleScrollToPlayground}
                        className="cursor-pointer group px-6 py-3 sm:px-8 sm:py-3.5 bg-zinc-100 text-zinc-950 text-sm sm:text-base font-bold rounded-md sm:rounded-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] w-full sm:w-auto min-w-[160px]"
                    >
                        <Play className="w-4 h-4 fill-zinc-950 group-hover:scale-110 transition-transform" />
                        Try Demo
                    </button>

                    {/* 2. SECONDARY: DOCS (Zinc-900 / Subtle) */}
                    <button
                        onClick={onDocsClick}
                        className="cursor-pointer group px-6 py-3 sm:px-8 sm:py-3.5 bg-zinc-900/50 text-zinc-200 border border-zinc-800 text-sm sm:text-base font-bold rounded-md sm:rounded-lg hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto min-w-[160px]"
                    >
                        <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Read Docs
                    </button>

                    {/* 3. TERTIARY: NPM COPY (Ghost / Utility) */}
                    <button
                        onClick={handleCopy}
                        className="cursor-pointer group px-6 py-3 sm:px-8 sm:py-3.5 bg-black/50 border border-zinc-900 text-zinc-500 text-sm sm:text-base font-mono font-medium rounded-md sm:rounded-lg hover:border-zinc-700 hover:text-zinc-300 transition-all flex items-center justify-center gap-2 w-full sm:w-auto min-w-[160px]"
                    >
                        {copied ? (
                            <><Check className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
                        ) : (
                            <><Copy className="w-4 h-4" /><span>npm i react-brai</span></>
                        )}
                    </button>
                </div>

                <div className="w-screen max-w-6xl space-y-4">
                    <Marquee items={MODELS_SQUAD} direction="left" speed={45} />
                    <Marquee items={PROBLEM_SOLVERS} direction="right" speed={55} />
                </div>
            </motion.div>

            {/* Sync Connector - VISIBLE ON ALL SCREENS */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex absolute bottom-4 sm:bottom-8 z-20 flex-col items-center gap-2 sm:gap-3 group cursor-pointer w-full px-4 sm:px-0"
                onClick={onDocsClick}
            >
                <ZincTooltip content="Check if your device is powerful enough for local AI.">
                    <div className="flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-zinc-800 bg-black/80 backdrop-blur-md shadow-lg hover:border-zinc-600 transition-colors max-w-full cursor-help">
                        <div className={`p-1.5 rounded bg-zinc-800 flex-shrink-0 ${gpuStatus.state === "READY" ? "text-emerald-400" :
                            gpuStatus.state === "UNSUPPORTED" ? "text-rose-400" : "text-amber-400"
                            }`}>
                            <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>

                        <div className="text-left overflow-hidden">
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-600 font-bold truncate">
                                {gpuStatus.state === "UNSUPPORTED" && "HARDWARE NOT COMPATIBLE"}
                                {gpuStatus.state === "READY" && "HARDWARE COMPATIBLE"}
                                {gpuStatus.state === "CHECKING" && "CHECKING HARDWARE..."}
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-zinc-300 group-hover:text-white flex items-center gap-2 truncate">
                                <span className="truncate">{gpuStatus.name}</span>
                                {gpuStatus.state === "CHECKING" && <span className="flex-shrink-0 inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 animate-pulse" />}
                                {gpuStatus.state === "READY" && <span className="flex-shrink-0 inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                {gpuStatus.state === "UNSUPPORTED" && <span className="flex-shrink-0 inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />}
                            </p>
                        </div>
                    </div>
                </ZincTooltip>
                <div className="hidden sm:block w-[1px] h-8 bg-gradient-to-b from-zinc-800 to-transparent" />
            </motion.div>
        </section>
    );
}