"use client";
import { useState, useEffect } from "react";
import { useLocalAI } from "react-brai";
import { ArrowRight, Loader2, Database, Terminal, FileText, Code, Braces } from "lucide-react";

// 1. FIX: Update Default Schema to match your "Recruitment" Prompt
const DEFAULT_INTERFACE = `export interface SearchFilter {
  name?: string;
  skills?: string[]; 
  location?: string;
  minExpectedCTC?: number;
  maxExpectedCTC?: number;
  minExperience?: number;
  maxExperience?: number;
  minCurrentCTC?: number;
  maxCurrentCTC?: number;
  createdAfter?: string; // ISO Date String
  createdBefore?: string; // ISO Date String
  organizationId?: string;
  logicOperator?: '$and' | '$or';
  page: number;
  limit: number;
}`;

export default function Refinery() {
    const ai = useLocalAI();
    const [input, setInput] = useState("");
    const [schema, setSchema] = useState(DEFAULT_INTERFACE);
    // New state to hold the "Clean" JSON after parsing
    const [cleanOutput, setCleanOutput] = useState("");

    const handleLoadModel = async () => {
        try {
            await ai.loadModel("Llama-3.2-3B-Instruct-q4f16_1-MLC", {
                contextWindow: 4096,
                temperature: 0.1,      // Strict for JSON
                repetition_penalty: 1.1 // 2. FIX: Prevents "Infinite Loop" hallucinations
            });
        } catch (err) {
            console.error("Failed to load model:", err);
        }
    };

    // 3. FIX: Real-time Cleaner (Removes Markdown ```json ... ```)
    useEffect(() => {
        if (ai.response) {
            const clean = ai.response
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            setCleanOutput(clean);
        }
    }, [ai.response]);

    const handleRefine = async () => {
        if (!input || !schema) return;

        const today = new Date().toISOString().split('T')[0];

        // 4. FIX: Tightened System Prompt
        const systemPrompt = `
        You are a Recruitment Search Parser.
        Current Date: ${today}

        TASK:
        Convert the "Input Text" into a valid JSON object matching the "TARGET JSON STRUCTURE".

        LOGIC RULES:
        - "LPA" (Lakhs) -> Multiply by 100,000 (e.g. 10 LPA = 1000000).
        - "k" (Thousands) -> Multiply by 1,000.
        - "budget/ask" -> map to min/maxExpectedCTC.
        - "current/earning" -> map to min/maxCurrentCTC.
        - "freshers" -> minExperience: 0, maxExperience: 1.
        - "last X days" -> calculate 'createdAfter' date relative to Today.
        
        OUTPUT RULES:
        - Return ONLY JSON. No comments, no markdown.
        - Default 'page': 1, 'limit': 20.
        
        TARGET JSON STRUCTURE:
        ${schema}
        `;

        try {
            setCleanOutput(""); // Clear previous output
            await ai.chat([
                { role: "system", content: systemPrompt },
                { role: "user", content: `Input Text:\n${input}` }
            ]);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="h-screen bg-zinc-950 text-white flex flex-col p-8 border-t border-zinc-900 relative">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-blue-400">Data Refinery</h1>
                    <p className="text-zinc-500">Universal JSON Extractor (Local)</p>
                </div>
                <div className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                    {ai.isReady ? <span className="text-emerald-500">Model Online</span> :
                        ai.isLoading ? <span className="text-blue-400">Initializing...</span> : "Model Offline"}
                </div>
            </header>

            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-6 overflow-hidden">
                {/* LEFT: Inputs */}
                <div className="flex flex-col gap-4 h-full">
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> QUERY / INPUT
                        </label>
                        <textarea
                            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-700"
                            placeholder="e.g. 'Looking for React devs with 3 years exp, asking under 15 LPA'"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                            <Braces className="w-4 h-4" /> TARGET SCHEMA
                        </label>
                        <textarea
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs resize-none focus:outline-none focus:border-emerald-500/50 transition-colors text-emerald-400/80 placeholder:text-zinc-800"
                            value={schema}
                            onChange={(e) => setSchema(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* CENTER: Action */}
                <div className="flex flex-col justify-center items-center gap-4">
                    {!ai.isReady ? (
                        <button
                            onClick={handleLoadModel}
                            disabled={ai.isLoading}
                            className={`group relative px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] ${ai.isLoading ? "bg-zinc-800 text-zinc-500 cursor-wait" : "bg-white text-black hover:scale-105"}`}
                        >
                            {ai.isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Loading...</> : <><Terminal className="w-5 h-5" />Load Brain</>}
                        </button>
                    ) : (
                        <button
                            onClick={handleRefine}
                            disabled={ai.isLoading || !input}
                            className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/30"
                        >
                            {ai.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                        </button>
                    )}
                    {/* Progress Bar */}
                    {!ai.isReady && ai.progress && (
                        <div className="w-32 space-y-1">
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(ai.progress.progress || 0) * 100}%` }} />
                            </div>
                            <p className="text-[10px] text-center text-zinc-500 font-mono">{Math.round((ai.progress.progress || 0) * 100)}%</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Clean Output */}
                <div className="flex flex-col gap-2 h-full">
                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                        <Code className="w-4 h-4" /> GENERATED JSON
                    </label>
                    <div className={`flex-1 bg-zinc-900 border rounded-xl p-4 font-mono text-sm overflow-auto custom-scrollbar whitespace-pre-wrap ${ai.isLoading ? "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-zinc-800"}`}>
                        {cleanOutput || ai.response ? (
                            <div className="text-blue-200">
                                {cleanOutput || ai.response}
                                {ai.isLoading && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle" />}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 select-none">
                                <Database className="w-12 h-12 mb-4" />
                                <p className="text-xs">Waiting for Data...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}