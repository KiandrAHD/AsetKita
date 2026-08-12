import { useState } from "react";
import { Award, Landmark, WalletCards, TrendingUp, Plus } from "lucide-react";
import DashboardCard from "./DashboardCard";
import TopUpModal from "./TopUpModal";
import { formatRupiah } from "@/utils/formatters";
import type { DashboardSummary } from "@/types/dashboard";

export default function SummaryCards({
    summary,
    onTopUpSuccess,
}: {
    summary: DashboardSummary;
    onTopUpSuccess?: () => void;
}) {
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);

    const cards = [
        {
            label: "Saldo",
            value: formatRupiah(summary.balance),
            hint: "Dana siap digunakan",
            icon: WalletCards,
            isSaldo: true,
        },
        {
            label: "Total Aset",
            value: formatRupiah(summary.totalAssets),
            hint: "Seluruh kepemilikan",
            icon: Landmark,
            isSaldo: false,
        },
        {
            label: "Nilai Portofolio",
            value: formatRupiah(summary.portfolioValue),
            hint: "Nilai pasar saat ini",
            icon: TrendingUp,
            isSaldo: false,
        },
        {
            label: "Financial Score",
            value: `${summary.financialScore} / 100`,
            hint: summary.financialScore
                ? "Terus bangun kebiasaan baik"
                : "Mulai dari investasi pertama",
            icon: Award,
            isSaldo: false,
        },
    ];

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, hint, icon: Icon, isSaldo }) => (
                    <DashboardCard key={label} className="relative p-5">
                        <div className="flex items-start justify-between">
                            <p className="text-sm text-slate-400">{label}</p>
                            <Icon size={18} className="text-cyan-300" />
                        </div>
                        <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                            {value}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-slate-400">{hint}</p>
                            {isSaldo && (
                                <button
                                    onClick={() => setIsTopUpOpen(true)}
                                    className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-400/20 hover:text-white"
                                >
                                    <Plus size={13} />
                                    <span>Top Up</span>
                                </button>
                            )}
                        </div>
                    </DashboardCard>
                ))}
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                onSuccess={() => {
                    if (onTopUpSuccess) onTopUpSuccess();
                }}
            />
        </>
    );
}
