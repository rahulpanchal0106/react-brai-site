"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Terminal, Database, Cpu, AlertTriangle, CheckCircle2, Download,
    RefreshCw, Eraser, FileJson, MessageSquare, Loader2, Play, Copy,
    Trash2, Box, BrainCircuit, Sparkles, Zap, ChevronRight, Activity,
    RotateCcw, ListOrdered, Share2, Server, Clock,
    Search, PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2, EyeOff, Eye,
    File,
    Briefcase,
    FileText,
    UploadCloud,
    X,
    Files
} from "lucide-react";
import { useLocalAI } from "react-brai";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


import remarkGfm from 'remark-gfm';
import ZincTooltip from "./ZincToolTip";
import { BraiLogo } from "./braiLogo";

// ============================================================================
// SUB-APP: BULK CSV PROCESSOR
// ============================================================================
import Papa from 'papaparse';

const BulkApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [csvData, setCsvData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [selectedColumn, setSelectedColumn] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    // Persistence & Sorting States
    const [isMounted, setIsMounted] = useState(false);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("oldest");
    const STORAGE_KEY = "react-brai-bulk-results";

    const latestResponse = useRef("");
    useEffect(() => { 
        if (streamBuffer) latestResponse.current = streamBuffer; 
    }, [streamBuffer]);

    const isLoadingRef = useRef(isLoading);
    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setResults(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved bulk data");
            }
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        }
    }, [results, isMounted]);

    const targetSchemaPreview = {
        "intent": "string (Core topic of the text)",
        "tone": "Enum: [Empathetic, Professional, Apologetic, Frustrated]",
        "resolution_provided": "boolean",
        "required_user_action": "string (What the user must do next)",
        "policies_mentioned": "array of strings (Specific rules cited)"
    };

    const getPrompt = (text: string) => [
        { 
            role: "system", 
            content: "You are a strict customer support log analyzer. Extract the data into JSON. Output ONLY valid JSON. Do not add any conversational text. Use null if a piece of data is missing. The keys must be exactly: intent, tone, resolution_provided, required_user_action, policies_mentioned." 
        },
        {
            role: "user",
            content: "Text: I am so sorry your package was delayed. We have issued a full refund. Please print the return label attached and drop the broken item at USPS."
        },
        {
            role: "assistant",
            content: "{\n  \"intent\": \"item_return_and_refund\",\n  \"tone\": \"Apologetic\",\n  \"resolution_provided\": true,\n  \"required_user_action\": \"Print return label and drop at USPS\",\n  \"policies_mentioned\": []\n}"
        },
        { role: "user", content: `Text: ${text}` }
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                setCsvData(result.data);
                if (result.meta.fields) {
                    setColumns(result.meta.fields);
                    setSelectedColumn(result.meta.fields[0]);
                }
            }
        });
    };

    const startBulkProcess = async () => {
        if (!csvData.length || !selectedColumn || isProcessing) return;
        setIsProcessing(true);
        setProgress({ current: 0, total: csvData.length });

        for (let i = 0; i < csvData.length; i++) {
            const rawText = csvData[i][selectedColumn];
            if (!rawText) continue;

            try {
                latestResponse.current = ""; 
                await chat(getPrompt(rawText)); 
                
                // ==========================================
                // THE MACBOOK FIX: TWO-STAGE TRAFFIC LIGHT
                // ==========================================
                
                // STAGE 1: Wait for the engine to START (isLoading flips to true)
                // We poll every 50ms for up to 5 seconds to give the Mac time to wake up
                let spinUpWaits = 0;
                while (!isLoadingRef.current && spinUpWaits < 100) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    spinUpWaits++;
                }
                
                // STAGE 2: Wait for the engine to FINISH (isLoading flips to false)
                while (isLoadingRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // ==========================================
                
                const rawOutput = latestResponse.current;
                let parsedJson = null;
                try {
                    const startIdx = rawOutput.indexOf('{');
                    const endIdx = rawOutput.lastIndexOf('}');
                    if (startIdx !== -1 && endIdx !== -1) {
                        parsedJson = JSON.parse(rawOutput.substring(startIdx, endIdx + 1));
                    }
                } catch (e) {
                    console.error("JSON parse failed on row", i, rawOutput);
                }

                setResults(prev => [...prev, {
                    id: prev.length + 1,
                    original: rawText,
                    status: parsedJson ? "Processed" : "Failed",
                    data: parsedJson
                }]);
                
            } catch (err) {
                console.error("Inference failed on row", i);
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
        setIsProcessing(false);
    };

    const handleClearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setResults([]);
        setCsvData([]);
        setProgress({ current: 0, total: 0 });
    };

    if (!isMounted) return null;

    const displayedResults = sortOrder === "newest" ? [...results].reverse() : results;

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Database className="w-5 h-5 text-sky-500" />
                        Bulk Customer Support Analyzer
                    </h3>
                    <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                        {results.length} Records
                    </span>
                    
                    {results.length > 0 && (
                        <button 
                            onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                            className="text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer select-none"
                            title="Toggle reading direction"
                        >
                            <ListOrdered className="w-3 h-3" />
                            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    {results.length > 0 && !isProcessing && (
                        <button 
                            onClick={handleClearHistory} 
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors" 
                            title="Nuke Local Database"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    <label className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                        Upload CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    
                    {columns.length > 0 && (
                        <select 
                            value={selectedColumn} 
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            className="bg-black border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-sky-500 max-w-[150px] truncate"
                        >
                            {columns.map(col => <option key={col} value={col}>Target: {col}</option>)}
                        </select>
                    )}

                    <button 
                        onClick={startBulkProcess}
                        disabled={isProcessing || !csvData.length}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        {isProcessing ? `Processing ${progress.current}/${progress.total}` : "Start Batch"}
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="mb-6 w-full bg-zinc-900 rounded-full h-1.5 border border-zinc-800 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-2 pb-12">
                {results.length === 0 && !isProcessing ? (
                    // ==========================================
                    // THE NEW ONBOARDING EMPTY STATE
                    // ==========================================
                    <div className="h-full flex flex-col items-center justify-center text-sm max-w-4xl mx-auto w-full px-4 pt-8 pb-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            
                            {/* Left Column: Instructions & Dataset */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 h-full flex flex-col">
                                    <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-lg">
                                        <ListOrdered className="w-5 h-5 text-sky-500" /> Pipeline Overview
                                    </h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                        Upload a CSV file containing unstructured support logs. Select your target column, and the local WebGPU engine will sequentially process each row, strictly formatting the chaotic text into clean, structured JSON data.
                                    </p>
                                    
                                    <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-xl flex flex-col gap-3 mt-auto">
                                        <span className="text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4" /> Demo Dataset
                                        </span>
                                        <p className="text-sm text-zinc-300 leading-relaxed">
                                            To test this pipeline, download the official <a href="https://huggingface.co/datasets/bitext/Bitext-customer-support-llm-chatbot-training-dataset/blob/main/Bitext_Sample_Customer_Support_Training_Dataset_27K_responses-v11.csv" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors font-bold">Bitext Customer Support Dataset</a> from HuggingFace. 
                                        </p>
                                        <div className="bg-black/50 p-3 rounded-lg border border-sky-500/10 text-xs text-zinc-400 font-mono mt-1">
                                            1. Upload the CSV.<br/>
                                            2. Set Target to: <span className="text-emerald-400 font-bold">response</span><br/>
                                            3. Click Start Batch.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Schema Preview */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 h-full flex flex-col">
                                    <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-lg">
                                        <FileJson className="w-5 h-5 text-emerald-500" /> Target Schema
                                    </h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                        The zero-shot prompt forces the edge model to format every row into this exact JSON structure:
                                    </p>
                                    <div className="flex-1 bg-[#0a0a0a] border border-zinc-800/80 rounded-xl p-5 font-mono text-xs text-emerald-400/90 overflow-auto shadow-inner relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0"></div>
                                        <pre className="leading-loose">{JSON.stringify(targetSchemaPreview, null, 2)}</pre>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    // ==========================================
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                        {displayedResults.map((item, idx) => (
                            <div key={item.id} className={`bg-zinc-900/40 border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden ${item.status === "Processed" ? "border-zinc-800" : "border-red-900/30"}`}>
                                {item.status === "Processed" && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>}
                                {item.status === "Failed" && <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>}
                                
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Row {item.id}</span>
                                    {item.status === "Processed" ? (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Extracted
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Error
                                        </span>
                                    )}
                                </div>
                                
                                <details className="group/text mb-1">
                                    <summary className="text-xs text-zinc-400 italic cursor-pointer outline-none hover:text-zinc-300 flex items-start gap-1.5 select-none list-none [&::-webkit-details-marker]:hidden">
                                        <ChevronRight className="w-3 h-3 mt-0.5 group-open/text:rotate-90 transition-transform shrink-0 opacity-50 group-hover/text:opacity-100" />
                                        <span className="line-clamp-2 group-open/text:line-clamp-none leading-relaxed transition-all">
                                            "{item.original}"
                                        </span>
                                    </summary>
                                </details>
                                
                                <div className="mt-auto pt-3 border-t border-zinc-800/50 flex flex-col gap-3">
                                    {item.data ? (
                                        <>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="bg-black border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                                                    Intent: <span className="text-sky-400 font-bold max-w-[80px] truncate" title={item.data.intent}>{item.data.intent || "null"}</span>
                                                </span>
                                                <span className="bg-black border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                                                    Tone: <span className="text-amber-400 font-bold truncate max-w-[60px]" title={item.data.tone}>{item.data.tone || "null"}</span>
                                                </span>
                                                <span className="bg-black border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                                                    Resolved: <span className={`font-bold ${item.data.resolution_provided ? 'text-emerald-400' : 'text-red-400'}`}>{item.data.resolution_provided ? 'Yes' : 'No'}</span>
                                                </span>
                                            </div>

                                            <details className="group">
                                                <summary className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors flex items-center gap-1 select-none outline-none list-none [&::-webkit-details-marker]:hidden">
                                                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                                    View Extraction Details
                                                </summary>
                                                <div className="pt-3 flex flex-col gap-2">
                                                    <div className="bg-black/50 border border-zinc-800/50 rounded p-2">
                                                        <span className="text-[9px] text-zinc-500 uppercase block mb-1 font-bold">Required Action</span>
                                                        <span className="text-zinc-300 text-xs">{item.data.required_user_action || "None required."}</span>
                                                    </div>
                                                    <div className="bg-black/50 border border-zinc-800/50 rounded p-2">
                                                        <span className="text-[9px] text-zinc-500 uppercase block mb-1 font-bold">Policies Mentioned</span>
                                                        {item.data.policies_mentioned && item.data.policies_mentioned.length > 0 ? (
                                                            <ul className="list-disc pl-4 text-zinc-300 text-xs marker:text-zinc-700 space-y-1">
                                                                {item.data.policies_mentioned.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-zinc-500 text-xs italic">No policies cited.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-mono text-red-500/70">Failed to parse JSON schema.</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// SUB-APP: ATS RESUME PARSER 
// ============================================================================
const ResumeApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [fileName, setFileName] = useState("");
    const [isParsingPDF, setIsParsingPDF] = useState(false);

    // UI STATE
    const [showSchema, setShowSchema] = useState(true);
    const [isOutputExpanded, setIsOutputExpanded] = useState(false);

   const resumeSchema = {
    "name": "[Candidate Full Name]",
    "email": "[Email Address]",
    "phone": "[Phone Number]",
    "skills": ["[Skill 1]", "[Skill 2]"],
    "education": [
        { 
            "degree": "[Degree or Certificate Name]", 
            "year": "[Graduation Year]" 
        }
    ],
    "experience": [
        { 
            "company": "[Company Name]", 
            "years": "[Duration, e.g., 2020-2022]" 
        }
    ]
};

    // 2. Bulletproof prompt engineering
 const handleExtract = async () => {
    if (isLoading) return;
    setOutput("");
    
    await chat([
        { 
            role: "system", 
            content: `Extract the resume data into the provided JSON schema. 
Replace the bracketed instructions (e.g., "[Candidate Full Name]") with the actual data from the resume. 
If a piece of information is not mentioned in the resume, output an empty string "".
Output ONLY valid JSON.

Schema: 
${JSON.stringify(resumeSchema, null, 2)}` 
        },
        { role: "user", content: `Resume:\n${input}` }
    ]);
};
    
    useEffect(() => { 
        if (isLoading && streamBuffer) setOutput(streamBuffer); 
    }, [streamBuffer, isLoading]);

    // PDF EXTRACTION LOGIC
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        
        // If it's just a text file, read it directly
        if (file.type === "text/plain" || file.name.endsWith(".md")) {
            const text = await file.text();
            setInput(text);
            return;
        }

        // If it's a PDF, run it through pdf.js
        // If it's a PDF, run it through pdf.js dynamically
        if (file.type === "application/pdf") {
            setIsParsingPDF(true);
            try {
                // 1. DYNAMICALLY IMPORT THE LIBRARY ONLY WHEN NEEDED (Bypasses SSR)
                const pdfjsLib = await import('pdfjs-dist/build/pdf');
                
                // 2. Set the worker source using the dynamically loaded version
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                // 3. Proceed with normal extraction
                const arrayBuffer = await file.arrayBuffer(); // Use arrayBuffer() for modern JS
                const typedarray = new Uint8Array(arrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    fullText += pageText + "\n";
                }
                
                setInput(fullText); // Or push to queue if you are in the Bulk App
                
            } catch (error) {
                console.error("Error parsing PDF:", error);
                setInput("Error parsing PDF. Please try a different file.");
            } finally {
                setIsParsingPDF(false);
            }
        }
    };

    // --- NEW: Reset Function ---
    const handleClearFile = () => {
        setInput("");
        setFileName("");
        setOutput(""); // Optional: clear output when loading a new file
    };

  

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-500" />
                        Zero-Cost ATS: Resume Parser
                    </h3>
                    
                    {!showSchema && (
                        <button 
                            onClick={() => setShowSchema(true)} 
                            className="text-xs font-mono flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                            <Eye className="w-3 h-3" /> Show Schema
                        </button>
                    )}
                </div>

                {isLoading && (
                    <span className="text-xs font-mono text-indigo-400 animate-pulse bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                        Extracting Candidate Profile...
                    </span>
                )}
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full min-h-0">
                <div className={`flex flex-col  ${isOutputExpanded ? 'lg:w-[30%]' : 'lg:w-[60%]'}`}>
                    
                    {/* SCHEMA AREA */}
                    {showSchema && (
                        <div className={`flex flex-col gap-2 h-1/2 transition-all duration-500 ease-in-out `}>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-2">
                                    <Database className="w-3 h-3" /> Target Schema Profile
                                </label>
                                <button 
                                    onClick={() => setShowSchema(false)} 
                                    className="text-zinc-600 hover:text-red-400 transition-colors"
                                    title="Hide Schema Column"
                                >
                                    <EyeOff className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 font-mono text-[11px] text-zinc-400 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800">
                                <pre>{JSON.stringify(resumeSchema, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* INPUT AREA (DRAG AND DROP) */}
                    <div className={`flex flex-col gap-2 transition-all duration-500 ease-in-out ${showSchema?'h-1/2':'h-full'} w-full `}>
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center justify-between h-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Input Source
                            </div>
                            {fileName && (
                                <div className="flex items-center gap-2">
                                    <span className="text-indigo-400 lowercase normal-case truncate max-w-[150px]">{fileName}</span>
                                    {/* --- NEW: Clear Button --- */}
                                    <button 
                                        onClick={handleClearFile}
                                        className="bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 p-0.5 rounded transition-colors"
                                        title="Clear File"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </label>
                        
                        {input ? (
                             <textarea 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none scrollbar-thin scrollbar-thumb-zinc-800 leading-relaxed" 
                            />
                        ) : (
                            <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col items-center justify-center relative group">
                                <input 
                                    type="file" 
                                    accept=".pdf,.txt,.md"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {isParsingPDF ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                        <p className="text-sm font-bold text-zinc-300 font-mono">Parsing Document...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-center p-6">
                                        <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 group-hover:border-indigo-500/50 transition-colors">
                                            <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-300 mb-1">Click or drag resume here</p>
                                            <p className="text-xs text-zinc-500">Supports PDF, TXT, and MD</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* OUTPUT AREA */}
                <div className={`flex flex-col gap-2 transition-all duration-500 ease-in-out ${isOutputExpanded ? 'flex-1' : (showSchema ? 'lg:w-[35%]' : 'lg:w-[50%]')}`}>
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-wider text-indigo-500/70 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Candidate JSON Profile
                        </label>
                        <button 
                            onClick={() => setIsOutputExpanded(!isOutputExpanded)} 
                            className="text-indigo-700 hover:text-indigo-400 transition-colors bg-indigo-900/20 p-1 rounded"
                            title={isOutputExpanded ? "Shrink Output Panel" : "Maximize Output Panel"}
                        >
                            {isOutputExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        </button>
                    </div>
                    <div className="flex-1 bg-[#050715] border border-indigo-900/30 rounded-lg p-4 font-mono text-sm text-indigo-400 overflow-auto relative shadow-[inset_0_0_20px_rgba(99,102,241,0.02)] scrollbar-thin scrollbar-thumb-indigo-900/50">
                        <pre className="whitespace-pre-wrap">{output || "// Awaiting resume parsing..."}</pre>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button 
                    onClick={handleExtract} 
                    disabled={isLoading || !input.trim()} 
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 
                    Parse Candidate
                </button>
            </div>
        </div>
    );
};
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
    // {
    //     id: "NotReleasedYet",
    //     name: "Gemma 4 E2B",
    //     size: "1.45 GB",
    //     vram: "2.5GB",
    //     desc: "Google's newest Edge model. Perfect for fast, zero-latency JSON extraction."
    // },
    {
        id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        name: "Llama 3.2 1B",
        size: "1.2 GB",
        vram: "2GB",
        desc: "Fastest alternative. Good for simple formatting."
    },
    {
        id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
        name: "Qwen 2.5 1.5B",
        size: "1.6 GB",
        vram: "3GB",
        desc: "Excellent reasoning for its size. Rivals larger models."
    },
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
    { id: "resume", name: "ATS Resume Parser", icon: Briefcase },
    { id: "bulkapp", name: "Bulk Customer Support Analyzer", icon: File },
    { id: "bulkresume", name: "Bulk ATS Processor", icon: Files },
];

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function Playground() {
    const hookData = useLocalAI();

    const {
        loadModel, chat, isReady = false, isLoading = false, progress, response, error,
        queue = [], role = "PENDING", tabId, tps
    } = hookData || {};

    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
    const [activeApp, setActiveApp] = useState("json"); // Set JSON as default for your demo
    const [tpsHistory, setTpsHistory] = useState(new Array(40).fill(0));
    
    // NEW UI STATE: Sidebar Toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [bootState, setBootState] = useState<"IDLE" | "LOADING" | "ERROR" | "WORKSPACE">("IDLE");

    useEffect(() => {
        const syncModelSelection = () => {
            try {
                const savedConfig = localStorage.getItem('brai_active_model_config');
                if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    const modelId = typeof config.model === 'string' ? config.model : config.model.model_id;
                    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
                    if (found) setSelectedModel(found);
                }
            } catch (e) { }
        };
        syncModelSelection();
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

    return (
        <div id="playground" className="w-full min-h-[900px] bg-black border-t border-zinc-900 relative font-sans flex flex-col items-center py-24">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4612_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4612_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 text-center mb-12 space-y-4 px-4">
                <ZincTooltip content="Distributes GPU load through a Leader-Follower architecture.">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono font-medium cursor-help">
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

            <div className="relative z-20 w-full max-w-[1400px] px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[750px] transition-all duration-500 ease-in-out">

                    {/* --- LEFT PANEL: CONFIG (Collapsible) --- */}
                    {isSidebarOpen && (
                        <div className="lg:col-span-3 flex flex-col gap-6 h-auto lg:h-full overflow-visible lg:overflow-y-auto pr-1 order-2 lg:order-1 opacity-100 transition-opacity duration-300">
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
                                                Looking for more? Find <a href="https://huggingface.co/models?search=q4f16_1-MLC" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 hover:underline transition-colors">compatible models</a> on HuggingFace ending in <code className="bg-zinc-950 border border-zinc-800 px-1 py-0.5 rounded text-zinc-300 font-mono">q4f16_1-MLC</code>
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
                                            <div className="grid grid-cols-1 gap-2">
                                                {DEMO_APPS.map((app) => (
                                                    <button
                                                        key={app.id}
                                                        onClick={() => setActiveApp(app.id)}
                                                        className={`flex items-center justify-start gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${activeApp === app.id
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
                    )}

                    {/* --- RIGHT PANEL: WORKSPACE (Expands when Sidebar is Closed) --- */}
                    <div className={`${isSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'} h-[600px] lg:h-full flex flex-col rounded-2xl border border-zinc-800 bg-black shadow-2xl overflow-hidden relative order-1 lg:order-2 transition-all duration-500 ease-in-out`}>
                        <div className="h-12 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 shrink-0">
                            <div className="flex gap-4 items-center">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                </div>
                                <button 
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                                    className="hidden lg:flex items-center justify-center w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                    title={isSidebarOpen ? "Hide Config Panel" : "Show Config Panel"}
                                >
                                    {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                                </button>
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

                            {bootState === "WORKSPACE" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 bg-[#050505] overflow-hidden">
                                    {activeApp === "bulkresume" && <BulkResumeApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "chat" && <ChatApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "resume" && <ResumeApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "json" && <JsonApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "redact" && <RedactApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
                                    {activeApp === "bulkapp" && < BulkApp chat={chat} isLoading={isLoading} streamBuffer={response} />}
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
// SUB-APP: BULK ATS RESUME PROCESSOR
// ============================================================================
const BulkResumeApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [queue, setQueue] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExtractingText, setIsExtractingText] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    // Persistence & Sorting States
    const [isMounted, setIsMounted] = useState(false);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("oldest");
    const STORAGE_KEY = "react-brai-bulk-resumes";

    const latestResponse = useRef("");
    useEffect(() => { 
        if (streamBuffer) latestResponse.current = streamBuffer; 
    }, [streamBuffer]);

    const isLoadingRef = useRef(isLoading);
    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setQueue(JSON.parse(saved)); } catch (e) { console.error("Failed to parse saved bulk data"); }
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            // We omit the raw text from localStorage to save quota, only saving status/data
            const strippedQueue = queue.map(item => ({ ...item, rawText: "" }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(strippedQueue));
        }
    }, [queue, isMounted]);

   // 1. Clean, empty schema. No instruction text inside the values.
   const resumeSchema = {
    "name": "[Candidate Full Name]",
    "email": "[Email Address]",
    "phone": "[Phone Number]",
    "skills": ["[Skill 1]", "[Skill 2]"],
    "education": [
        { 
            "degree": "[Degree or Certificate Name]", 
            "year": "[Graduation Year]" 
        }
    ],
    "experience": [
        { 
            "company": "[Company Name]", 
            "years": "[Duration, e.g., 2020-2022]" 
        }
    ]
};



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setIsExtractingText(true);
        const newItems: any[] = [];

        for (const file of files) {
            let extractedText = "";
            try {
                if (file.type === "text/plain" || file.name.endsWith(".md")) {
                    extractedText = await file.text();
                } else if (file.type === "application/pdf") {
                    
                    // 1. Dynamically import PDF.js ONLY when a PDF is detected
                    const pdfjsLib = await import('pdfjs-dist/build/pdf');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                    const arrayBuffer = await file.arrayBuffer();
                    const typedarray = new Uint8Array(arrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;

                    // Extract text from all pages
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(" ");
                        extractedText += pageText + "\n";
                    }
                }
                
                // Add the successfully extracted text to the queue
                newItems.push({
                    id: Date.now() + Math.random(),
                    filename: file.name,
                    rawText: extractedText,
                    status: extractedText ? "Pending" : "Extraction Failed",
                    data: null
                });
                
            } catch (err) {
                console.error(`Failed to read file ${file.name}`, err);
                newItems.push({
                    id: Date.now() + Math.random(),
                    filename: file.name,
                    rawText: "",
                    status: "Extraction Failed",
                    data: null
                });
            }
        }

        setQueue(prev => [...prev, ...newItems]);
        setIsExtractingText(false);
        e.target.value = ''; // Reset the input
    };

    const startBulkProcess = async () => {
        const pendingItems = queue.filter(item => item.status === "Pending" && item.rawText);
        if (!pendingItems.length || isProcessing) return;
        
        setIsProcessing(true);
        setProgress({ current: 0, total: pendingItems.length });

        for (let i = 0; i < pendingItems.length; i++) {
            const currentItem = pendingItems[i];
            
            // Mark as processing
            setQueue(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: "Processing" } : item));

            try {
                latestResponse.current = ""; 
               await chat([
    { 
        role: "system", 
        content: `Extract the resume data into the exact JSON schema provided. Output ONLY valid JSON. Use null if missing. 
Schema: ${JSON.stringify(resumeSchema)}` 
    },
    { role: "user", content: `Resume:\n${currentItem.rawText}` }
]); 
                
                // ==========================================
                // THE MACBOOK FIX: TWO-STAGE TRAFFIC LIGHT
                // ==========================================
                let spinUpWaits = 0;
                while (!isLoadingRef.current && spinUpWaits < 100) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    spinUpWaits++;
                }
                while (isLoadingRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                // ==========================================
                
                const rawOutput = latestResponse.current;
                let parsedJson = null;
                try {
                    const startIdx = rawOutput.indexOf('{');
                    const endIdx = rawOutput.lastIndexOf('}');
                    if (startIdx !== -1 && endIdx !== -1) {
                        parsedJson = JSON.parse(rawOutput.substring(startIdx, endIdx + 1));
                    }
                } catch (e) {
                    console.error("JSON parse failed on file", currentItem.filename);
                }

                setQueue(prev => prev.map(item => 
                    item.id === currentItem.id ? { 
                        ...item, 
                        status: parsedJson ? "Processed" : "AI Failed", 
                        data: parsedJson 
                    } : item
                ));
                
            } catch (err) {
                console.error("Inference failed", err);
                setQueue(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: "AI Failed" } : item));
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
            await new Promise(resolve => setTimeout(resolve, 100)); // Small breather between files
        }
        setIsProcessing(false);
    };

    const handleClearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setQueue([]);
        setProgress({ current: 0, total: 0 });
    };

    if (!isMounted) return null;

    const displayedResults = sortOrder === "newest" ? [...queue].reverse() : queue;
    const pendingCount = queue.filter(q => q.status === "Pending").length;

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Files className="w-5 h-5 text-indigo-500" />
                        Bulk ATS Processor
                    </h3>
                    <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                        {queue.length} Resumes
                    </span>
                    
                    {queue.length > 0 && (
                        <button 
                            onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                            className="text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer select-none"
                        >
                            <ListOrdered className="w-3 h-3" />
                            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    {queue.length > 0 && !isProcessing && (
                        <button 
                            onClick={handleClearHistory} 
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors" 
                            title="Clear Queue"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    <label className={`bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isExtractingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isExtractingText ? "Extracting..." : "Upload Resumes"}
                        {/* Notice the 'multiple' attribute here! */}
                        <input type="file" accept=".pdf,.txt,.md" multiple onChange={handleFileUpload} className="hidden" disabled={isProcessing || isExtractingText} />
                    </label>

                    <button 
                        onClick={startBulkProcess}
                        disabled={isProcessing || pendingCount === 0 || isExtractingText}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        {isProcessing ? `Parsing ${progress.current}/${progress.total}` : `Start Batch (${pendingCount})`}
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="mb-6 w-full bg-zinc-900 rounded-full h-1.5 border border-zinc-800 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-2 pb-12">
                {queue.length === 0 && !isProcessing && !isExtractingText ? (
                    <div className="h-full flex flex-col items-center justify-center text-sm max-w-2xl mx-auto w-full px-4 text-center">
                        <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 mb-4">
                            <Files className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h4 className="text-white font-bold mb-2 text-lg">Drop your resume pile here</h4>
                        <p className="text-zinc-500 leading-relaxed max-w-md">
                            Select multiple PDF, TXT, or MD files at once. The engine will extract the raw text locally and queue them up for bulk JSON structuring.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                        {displayedResults.map((item) => (
                            <div key={item.id} className={`bg-zinc-900/40 border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden 
                                ${item.status === "Processed" ? "border-indigo-900/50" : 
                                  item.status === "Processing" ? "border-sky-900/50" :
                                  item.status.includes("Failed") ? "border-red-900/30" : "border-zinc-800"}`}>
                                
                                {item.status === "Processed" && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>}
                                {item.status === "Processing" && <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50 animate-pulse"></div>}
                                {item.status.includes("Failed") && <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>}
                                
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-zinc-300 truncate max-w-[180px]" title={item.filename}>
                                        {item.filename}
                                    </span>
                                    
                                    {item.status === "Processed" && (
                                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Extracted
                                        </span>
                                    )}
                                    {item.status === "Pending" && (
                                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                                            Queued
                                        </span>
                                    )}
                                    {item.status === "Processing" && (
                                        <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Parsing...
                                        </span>
                                    )}
                                    {item.status.includes("Failed") && (
                                        <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> {item.status}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="mt-auto pt-3 border-t border-zinc-800/50 flex flex-col gap-3">
                                    {item.data ? (
                                        <>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="bg-black border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                                                    Name: <span className="text-indigo-400 font-bold truncate max-w-[80px]" title={item.data.name}>{item.data.name || "null"}</span>
                                                </span>
                                                <span className="bg-black border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                                                    Skills: <span className="text-emerald-400 font-bold">{item.data.skills?.length || 0}</span>
                                                </span>
                                            </div>

                                            <details className="group">
                                                <summary className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors flex items-center gap-1 select-none outline-none list-none [&::-webkit-details-marker]:hidden">
                                                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                                    View Full JSON
                                                </summary>
                                                <div className="pt-3">
                                                    <div className="bg-black/80 border border-zinc-800/50 rounded p-3 overflow-auto max-h-[200px] scrollbar-thin scrollbar-thumb-zinc-800">
                                                        <pre className="text-[10px] text-indigo-300/80 font-mono m-0 leading-relaxed">
                                                            {JSON.stringify(item.data, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </details>
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-mono text-zinc-600 italic">
                                            {item.status === "Pending" ? "Waiting for execution..." : 
                                             item.status === "Processing" ? "AI is reading document..." : "No data extracted."}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// SUB-APP: CHAT (Untouched)
// ============================================================================
const ChatApp = ({ chat, isLoading, streamBuffer }: any) => {
    // ... [Content untouched from your previous code]
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

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        setMessages(saved ? JSON.parse(saved) : [DEFAULT_MSG]);
    }, []);

    useEffect(() => {
        if (isMounted && messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, isMounted]);

    useEffect(() => {
        if (!isLoading && activeStream && activeStream.length > 0) {
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: activeStream, timestamp: new Date().toISOString() }
            ]);
        }
    }, [isLoading, activeStream]);

    // useEffect(() => {
    //     if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    // }, [messages, activeStream, isLoading]);

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
        <div className="flex flex-col h-[600px] md:h-full bg-[#050505] relative border-t md:border-t-0 border-zinc-800 overflow-y-scroll">
            <div className="absolute top-4 right-6 z-10">
                <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setMessages([DEFAULT_MSG]); }} className="p-2 bg-zinc-900/80 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded-lg border border-zinc-800 transition-colors backdrop-blur-sm">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="absolute top-4 right-16 z-20 hidden md:block">
                <div className="bg-black/40 backdrop-blur border border-zinc-800 p-2 rounded-lg">
                    <ContextGauge stats={{ active: (messages.reduce((acc, m) => acc + m.content.length, 0) + (activeStream?.length || 0)), total: 4096 }} limit={4096} />
                </div>
            </div>
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
// SUB-APP: SUPPORT TICKET ANALYZER (FLEXBOX LAYOUT WITH TOGGLES)
// ============================================================================
const JsonApp = ({ chat, isLoading, streamBuffer }: any) => {
    const [input, setInput] = useState(
        "I'll make it happen! I understand your urgency in accessing our refund policy and getting all the necessary information about it. Our refund policy is designed with your satisfaction in mind, ensuring a fair and transparent process. To view our refund policy, you can visit our website and navigate to the \"Refund Policy\" section. There you will find detailed information about the situations in which you may be eligible for a refund, including product defects, cancellations within the grace period, unauthorized charges, event cancellations, duplicate charges, and non-receipt of goods. Remember that specific vendors or service providers may have additional nuances in their refund policies, so it's always a good idea to consult directly with them or review their terms and conditions for a comprehensive understanding. If you have any specific questions or concerns regarding our refund policy or a particular order, please provide me with the necessary details, such as the order number or any relevant information, and I'll be more than happy to assist you further. Your satisfaction is our top priority, and we want to ensure you have a clear understanding of our refund policy and how we can best support you."
    );
    const [output, setOutput] = useState("");

    // NEW UI STATE
    const [showSchema, setShowSchema] = useState(true);
    const [isOutputExpanded, setIsOutputExpanded] = useState(false);

    const supportSchema = {
        "intent": "string (Core topic of the text)",
        "tone": "Enum: [Empathetic, Professional, Apologetic, Frustrated]",
        "resolution_provided": "boolean",
        "required_user_action": "string (What the user must do next)",
        "policies_mentioned": "array of strings (Specific rules cited)"
    };
    
    useEffect(() => { 
        if (isLoading && streamBuffer) setOutput(streamBuffer); 
    }, [streamBuffer, isLoading]);

    const handleExtract = async () => {
        if (isLoading) return;
        setOutput("");
        await chat([
            { 
                role: "system", 
                content: "You are a strict customer support log analyzer. Extract the data into JSON. Output ONLY valid JSON. Do not add any conversational text. Use null if a piece of data is missing. The keys must be exactly: intent, tone, resolution_provided, required_user_action, policies_mentioned." 
            },
            {
                role: "user",
                content: "Text: I am so sorry your package was delayed. We have issued a full refund. Please print the return label attached and drop the broken item at USPS."
            },
            {
                role: "assistant",
                content: "{\n  \"intent\": \"item_return_and_refund\",\n  \"tone\": \"Apologetic\",\n  \"resolution_provided\": true,\n  \"required_user_action\": \"Print return label and drop at USPS\",\n  \"policies_mentioned\": []\n}"
            },
            { role: "user", content: `Text: ${input}` }
        ]);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-[#050505]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-sky-500" />
                        Zero-Cost Pipeline: Support Log Analyzer
                    </h3>
                    
                    {/* BUTTON TO RESTORE SCHEMA IF HIDDEN */}
                    {!showSchema && (
                        <button 
                            onClick={() => setShowSchema(true)} 
                            className="text-xs font-mono flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                            <Eye className="w-3 h-3" /> Show Schema
                        </button>
                    )}
                </div>

                {isLoading && (
                    <span className="text-xs font-mono text-sky-400 animate-pulse bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                        Running local inference...
                    </span>
                )}
            </div>
            
            {/* HORIZONTAL FLEX LAYOUT (Automatically resizes based on state) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full min-h-0">

                <div className={`flex flex-col  ${isOutputExpanded ? 'lg:w-[30%]' : 'lg:w-[60%]'}`}>
                    {/* 1. SCHEMA AREA (Collapsible) */}
                    {showSchema && (
                        <div className={`flex flex-col gap-2 h-1/2 transition-all duration-500 ease-in-out `}>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-2">
                                    <Database className="w-3 h-3" /> Target Schema
                                </label>
                                <button 
                                    onClick={() => setShowSchema(false)} 
                                    className="text-zinc-600 hover:text-red-400 transition-colors"
                                    title="Hide Schema Column"
                                >
                                    <EyeOff className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 font-mono text-[11px] text-zinc-400 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800">
                                <pre>{JSON.stringify(supportSchema, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* 2. INPUT AREA (Automatically adjusts width) */}
                    <div className={`flex flex-col gap-2 transition-all duration-500 ease-in-out ${showSchema?'h-1/2':'h-full'} w-full `}>
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-2 h-4">
                            <MessageSquare className="w-3 h-3" /> Raw Text Input
                        </label>
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none scrollbar-thin scrollbar-thumb-zinc-800 leading-relaxed" 
                        />
                    </div>

                </div>


                {/* 3. OUTPUT AREA (Expandable) */}
                <div className={`flex flex-col gap-2 transition-all duration-500 ease-in-out ${isOutputExpanded ? 'flex-1' : (showSchema ? 'lg:w-[35%]' : 'lg:w-[50%]')}`}>
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Structured Output
                        </label>
                        <button 
                            onClick={() => setIsOutputExpanded(!isOutputExpanded)} 
                            className="text-emerald-700 hover:text-emerald-400 transition-colors bg-emerald-900/20 p-1 rounded"
                            title={isOutputExpanded ? "Shrink Output Panel" : "Maximize Output Panel"}
                        >
                            {isOutputExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        </button>
                    </div>
                    <div className="flex-1 bg-[#05150c] border border-emerald-900/30 rounded-lg p-4 font-mono text-sm text-emerald-400 overflow-auto relative shadow-[inset_0_0_20px_rgba(16,185,129,0.02)] scrollbar-thin scrollbar-thumb-emerald-900/50">
                        <pre className="whitespace-pre-wrap">{output || "// Awaiting execution..."}</pre>
                    </div>
                </div>
                
            </div>

            <div className="mt-6 flex justify-end">
                <button 
                    onClick={handleExtract} 
                    disabled={isLoading || !input.trim()} 
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.02]"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 
                    Execute Pipeline
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// SUB-APP: PII REDACTOR (Untouched)
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