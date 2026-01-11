import React from "react";
import { Package, Github, GithubIcon } from "lucide-react";
import { BraiLogo } from "./braiLogo";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-zinc-900 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

                {/* 1. Brand & License */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2">
                        {/* FIXED: w-6 h-6 (24px) instead of w-2 h-2 */}
                        <BraiLogo className="w-6 h-6 text-sky-500" />
                        <span className="text-sm font-bold text-zinc-300 tracking-wider">REACT BRAI</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                        MIT License • {new Date().getFullYear()}
                    </span>
                </div>

                {/* 2. The "Signature" (Center) */}
                <div className="text-sm text-zinc-500 font-medium">
                    An Edge AI Project By{" "}
                    <a
                        href="https://www.linkedin.com/in/rahul-panchal-05610824a/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-300 hover:text-sky-400 transition-colors border-b border-transparent hover:border-sky-400/50 pb-0.5"
                    >
                        Rahul Panchal
                    </a>
                </div>

                {/* 3. Socials (Right) */}
                <div className="flex items-center gap-3">
                    {/* Uncomment GitHub if you have the repo link ready */}
                    {/* <a href="https://github.com/your-repo" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800">
                        <Github className="w-4 h-4" />
                    </a> */}

                    <a
                        href="https://www.npmjs.com/~rahulpanchal16"
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                    >
                        <Package className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                        <span className="text-xs font-bold">npm</span>
                    </a>
                    <a
                        href="https://github.com/rahulpanchal0106"
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                    >
                        <GithubIcon className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                        <span className="text-xs font-bold">GitHub</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}