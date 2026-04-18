"use client";
import React, { useState, useEffect } from "react";
import { useLocalAI } from "react-brai";

export default function MinimalExtension() {
    const { loadModel, chat, isReady, isLoading, response, progress } = useLocalAI();
    const [output, setOutput] = useState("");

    // Boot the 3B model as soon as the panel opens
    useEffect(() => {
        if (!isReady && loadModel) {
            loadModel("Qwen2.5-3B-Instruct-q4f16_1-MLC", { contextWindow: 4096 });
        }
    }, [isReady]);

    const handleProcess = async () => {
        if (!isReady || isLoading) return;
        setOutput("");

        try {
            // Grab highlighted text from the active Chrome tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) return;

            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.getSelection()?.toString() || ""
            });

            const selectedText = injectionResults[0]?.result;
            if (!selectedText) {
                setOutput("⚠️ Please highlight some text on the webpage first.");
                return;
            }

            // Run WebGPU Inference
            await chat([
                { role: "system", content: "You are an expert Senior Engineer. Explain or summarize the following text concisely." },
                { role: "user", content: selectedText }
            ]);

        } catch (error) {
            console.error("Extension Error:", error);
            setOutput("Failed to access page. You might need to refresh the tab.");
        }
    };

    return (
        <div className="p-4 bg-[#0a0a0a] text-zinc-300 h-screen font-sans flex flex-col border-l border-zinc-800">
            <h2 className="text-sm font-bold text-white mb-3">Omni-Agent (Lite)</h2>

            {!isReady ? (
                <div className="text-[10px] text-zinc-500 font-mono border border-zinc-800 p-3 rounded bg-zinc-900/50">
                    {progress?.text || "Initializing WebGPU Engine..."}
                </div>
            ) : (
                <button
                    onClick={handleProcess}
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold py-2 rounded-md text-xs transition-colors hover:bg-zinc-200 disabled:opacity-50 mb-4 shadow-sm"
                >
                    {isLoading ? "Processing..." : "Process Highlighted Text"}
                </button>
            )}

            <div className="flex-1 overflow-y-auto text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {response || output}
            </div>
        </div>
    );
}