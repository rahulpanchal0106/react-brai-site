"use client";
import React, { useState, useEffect, useRef } from "react";
import { useLocalAI } from "react-brai";
import { BrainCircuit, Code, Bug, FileText, Loader2, Play } from "lucide-react";

export default function ExtensionMVP() {
    // Initialize your local Swarm hook
    const { loadModel, chat, isReady, isLoading, response, progress } = useLocalAI();
    
    const [action, setAction] = useState("explain");
    const [output, setOutput] = useState("");
    const [statusText, setStatusText] = useState("Highlight text on the page and select an action.");

    // Auto-update output as the local model streams
    useEffect(() => {
        if (isLoading && response) setOutput(response);
    }, [isLoading, response]);

    // Load the Goldilocks model on boot
    useEffect(() => {
        if (!isReady && loadModel) {
            // Using Qwen 2.5 3B because it is incredible at coding and logic tasks
            loadModel("Qwen2.5-3B-Instruct-q4f16_1-MLC", { contextWindow: 4096 });
        }
    }, [isReady]);

    const prompts = {
        explain: "You are an expert Senior Engineer. Explain the following code or text concisely. Break down what it does step-by-step.",
        refactor: "You are an expert Senior Engineer. Refactor the following code to be cleaner, more modern, and more efficient. Output ONLY the code.",
        summarize: "Summarize the following text into 3 bullet points."
    };

    const handleProcessSelection = async () => {
        if (isLoading) return;
        setOutput("");
        setStatusText("Grabbing selection...");

        // 1. Check if we are actually running inside Chrome Extension environment
        if (typeof chrome === "undefined" || !chrome.tabs) {
            setStatusText("Error: Not running inside Chrome Extension.");
            return;
        }

        try {
            // 2. Find the active tab the user is currently looking at
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.id) throw new Error("No active tab found.");

            // 3. Inject a tiny script to grab the user's highlighted text
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.getSelection()?.toString() || ""
            });

            const selectedText = injectionResults[0]?.result;

            if (!selectedText) {
                setStatusText("No text highlighted! Please highlight something on the page.");
                return;
            }

            setStatusText("Running local inference...");

            // 4. Feed the highlighted text to your GPU
            await chat([
                { role: "system", content: prompts[action as keyof typeof prompts] },
                { role: "user", content: selectedText }
            ]);

            setStatusText("Done.");

        } catch (error) {
            console.error(error);
            setStatusText("Failed to access page. You might need to refresh the tab.");
        }
    };

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-zinc-400 p-6 text-center">
                <BrainCircuit className="w-10 h-10 mb-4 animate-pulse text-sky-500" />
                <p className="text-sm font-mono">{progress?.text || "Loading..."}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden border-l border-zinc-800">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                <h1 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <BrainCircuit className="w-4 h-4 text-sky-500" /> Omni-Agent
                </h1>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button onClick={() => setAction("explain")} className={`p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider font-bold transition-colors ${action === 'explain' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                        <Bug className="w-4 h-4" /> Explain
                    </button>
                    <button onClick={() => setAction("refactor")} className={`p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider font-bold transition-colors ${action === 'refactor' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                        <Code className="w-4 h-4" /> Refactor
                    </button>
                    <button onClick={() => setAction("summarize")} className={`p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider font-bold transition-colors ${action === 'summarize' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                        <FileText className="w-4 h-4" /> Summarize
                    </button>
                </div>

                <button 
                    onClick={handleProcessSelection}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    Process Selection
                </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                <p className="text-[10px] text-zinc-500 font-mono mb-3">{statusText}</p>
                
                {output && (
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                        {output}
                    </div>
                )}
            </div>
        </div>
    );
}