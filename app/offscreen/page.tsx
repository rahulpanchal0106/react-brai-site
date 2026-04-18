"use client";
import { useEffect } from "react";
import { useLocalAI } from "react-brai";

export default function OffscreenEngine() {
    const { loadModel, chat, isReady, response, progress } = useLocalAI();

    // 1. Boot the model as soon as the hidden document loads
    useEffect(() => {
        if (!isReady && loadModel) {
            loadModel("Qwen2.5-3B-Instruct-q4f16_1-MLC", { contextWindow: 4096 });
        }
    }, [isReady]);

    // 2. Stream progress back to the Side Panel
    useEffect(() => {
        if (progress?.text) {
            chrome.runtime.sendMessage({ type: "PROGRESS_UPDATE", payload: progress.text });
        }
    }, [progress]);

    // 3. Stream generated text back to the Side Panel
    useEffect(() => {
        if (response) {
            chrome.runtime.sendMessage({ type: "STREAM_UPDATE", payload: response });
        }
    }, [response]);

    // 4. Listen for commands FROM the Side Panel
    useEffect(() => {
        const handleMessage = async (message: any) => {
            if (message.type === "RUN_INFERENCE") {
                if (!isReady) return;
                
                await chat([
                    { role: "system", content: "You are an expert Senior Engineer. Explain the following concisely." },
                    { role: "user", content: message.payload }
                ]);
                
                chrome.runtime.sendMessage({ type: "INFERENCE_COMPLETE" });
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [isReady, chat]);

    return (
        <div>
            <h1>Invisible AI Engine</h1>
            <p>If you can see this, something went wrong.</p>
        </div>
    );
}