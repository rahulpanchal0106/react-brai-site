"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    children: React.ReactNode;
    content: string;
}

export default function ZincTooltip({ children, content }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    // 1. Calculate position on hover
    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                // Center horizontally relative to the trigger
                left: rect.left + rect.width / 2,
                // Position above the trigger (with 10px gap)
                top: rect.top - 10
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    // 2. The Tooltip Component (Rendered into Body)
    const TooltipPortal = () => {
        if (!isVisible || typeof document === 'undefined') return null;

        return createPortal(
            <div
                className="fixed z-[9999] pointer-events-none flex flex-col items-center"
                style={{
                    left: coords.left,
                    top: coords.top,
                    // "translate-x-1/2" centers the tooltip on the coordinate
                    // "-translate-y-100" moves it up so the 'top' coord connects to the bottom of the tooltip
                    transform: "translate(-50%, -100%)"
                }}
            >
                {/* The Bubble */}
                <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-medium tracking-wide px-2.5 py-1 rounded shadow-xl whitespace-nowrap">
                    {content}
                </div>

                {/* The Arrow (Pointing Down) */}
                <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-800 -mt-[1px]" />
            </div>,
            document.body
        );
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-block" // Ensures strict wrapping
            >
                {children}
            </div>
            <TooltipPortal />
        </>
    );
}