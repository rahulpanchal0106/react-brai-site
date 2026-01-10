import React from "react";

export const BraiLogo = ({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) => {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 1. The React Orbit (Subtle Background) */}
            <ellipse cx="50" cy="50" rx="45" ry="20" transform="rotate(-45 50 50)" stroke={color} strokeWidth="2" strokeOpacity="0.3" />

            {/* 2. The Neural Connections (Main Shape) */}
            <path
                d="M50 20 L30 50 L50 80 L70 50 Z"
                stroke={color}
                strokeWidth="4"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]"
            />

            {/* 3. The Core Nodes (Glowing Dots) */}
            {/* Top */}
            <circle cx="50" cy="20" r="6" fill={color} className="animate-pulse" />
            {/* Left */}
            <circle cx="30" cy="50" r="6" fill={color} />
            {/* Right */}
            <circle cx="70" cy="50" r="6" fill={color} />
            {/* Bottom */}
            <circle cx="50" cy="80" r="6" fill={color} />

            {/* 4. Center Core (The 'Brain') */}
            <circle cx="50" cy="50" r="10" fill={color} className="animate-[ping_3s_ease-in-out_infinite] opacity-20" />
            <circle cx="50" cy="50" r="4" fill="white" />
        </svg>
    );
};