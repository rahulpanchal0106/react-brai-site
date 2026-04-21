    import React from "react";
    // Swapped Github for Shield to look more "Enterprise/Secure"
    import { Package, ShieldCheck, ExternalLink } from "lucide-react"; 
    import { BraiLogo } from "./braiLogo";
import Link from "next/link";

    export default function Footer() {
        return (
            <footer className="bg-black border-t border-zinc-900 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* 1. Brand & License - REMOVED MIT */}
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <div className="flex items-center gap-2">
                            <BraiLogo className="w-6 h-6 text-sky-500" />
                            <span className="text-sm font-bold text-zinc-300 tracking-wider">REACT BRAI</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
        © {new Date().getFullYear()} All rights reserved
    </span>
                    </div>

                    {/* 2. The "Signature" - Pivoted to Lab/Entity style */}
                    <div className="text-sm text-zinc-500 font-medium">
                        An Edge AI Project by{" "}
                        <Link href="https://www.linkedin.com/in/rahul-panchal-05610824a/" className="text-zinc-300" >Rahul Panchal</Link>
                    </div>

                    {/* 3. Socials - Cleaned up to look like a Product, not a Profile */}
                    <div className="flex items-center gap-3">
                        {/* <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 transition-all cursor-default">
                            <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
                            <span className="text-xs font-bold uppercase tracking-tighter">Enterprise Ready</span>
                        </div> */}

                        <a
                            href="https://www.npmjs.com/package/react-brai"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                        >
                            <Package className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                            <span className="text-xs font-bold">npm</span>
                        </a>
                    </div>
                </div>
            </footer>
        );
    }