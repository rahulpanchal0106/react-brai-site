import React from "react";

export const BraiLogo = ({ width = 46, height = 64, color = "currentColor" }: { width?: number, height?: number, className?: string, color?: string }) => {
    return (
        <svg width={width} height={height} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#0ea5e9" stroke-width="3" stroke-linecap="round">
                <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(45 32 32)" />

                <ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(135 32 32)" />

                <path d="M4 32H60" />
            </g>
        </svg>
    );
};