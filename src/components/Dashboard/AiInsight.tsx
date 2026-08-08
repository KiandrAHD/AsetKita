import { Bot, LockKeyhole } from "lucide-react";
import DashboardCard from "./DashboardCard";
export default function AiInsight({ isDemo }: { isDemo: boolean }) {
    return (
        <DashboardCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-white">
                    <Bot size={18} className="text-cyan-300" /> AI Insight
                </h2>
                {isDemo && (
                    <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                        Demo
                    </span>
                )}
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-[#091321]/70 p-4 text-sm leading-6 text-slate-400">
                {isDemo ? (
                    <>
                        <LockKeyhole className="mb-3 text-amber-300" size={20} />
                        AI hanya tersedia untuk akun asli. Buat akun untuk mendapatkan
                        insight investasi personal.
                    </>
                ) : (
                    "Nantinya AI Advisor akan muncul di sini."
                )}
            </div>
        </DashboardCard>
    );
}
