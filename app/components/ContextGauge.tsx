// 2. Mini Component for Context Memory
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
const ContextGauge = ({ stats, limit }) => {
    const { active, total } = stats;

    // Percentage of the Limit used (0 to 100%)
    const activePercent = Math.min((active / limit) * 100, 100);

    // Determine color (Safe -> Warning -> Critical)
    let colorClass = "bg-emerald-500";
    if (activePercent > 70) colorClass = "bg-amber-500";
    if (activePercent > 95) colorClass = "bg-rose-500";

    return (
        <div className="flex flex-col gap-1 w-48">
            {/* Header Text */}
            <div className="flex justify-between items-end text-[10px] uppercase font-mono tracking-wider">
                <span className="text-zinc-500">Context Window</span>
                <span className="text-zinc-300">
                    {/* Shows: Active / Limit */}
                    {(active / 1000).toFixed(1)}k <span className="text-zinc-600">/</span> {(limit / 1000).toFixed(0)}k
                </span>
            </div>

            {/* The Visual Bar */}
            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">

                {/* 1. The Active Window (The actual filled bar) */}
                <motion.div
                    className={`absolute top-0 left-0 h-full ${colorClass} shadow-[0_0_10px_currentColor] z-10`}
                    initial={{ width: 0 }}
                    animate={{ width: `${activePercent}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                />

                {/* 2. The "Overflow" Indicator (Optional: shows if history is larger than window) */}
                {total > limit && (
                    <div className="absolute top-0 right-0 h-full w-1 bg-white/20 z-20 animate-pulse" title="Oldest messages are being dropped" />
                )}
            </div>

            {/* Footer Text (Drift Indicator) */}
            <div className="flex justify-between text-[9px] font-mono">
                {total > limit ? (
                    <span className="text-orange-400 flex items-center gap-1">
                        <RotateCcw className="w-2 h-2" /> Overflow: +{((total - limit) / 1000).toFixed(1)}k hidden
                    </span>
                ) : (
                    <span className="text-zinc-600">Full history in context</span>
                )}
            </div>
        </div>
    );
};
export default ContextGauge;