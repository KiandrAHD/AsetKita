import { Award, Landmark, WalletCards, TrendingUp } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { formatRupiah } from "@/utils/formatters";
import type { DashboardSummary } from "@/types/dashboard";
const cards = (summary: DashboardSummary) => [
    {
        label: "Saldo",
        value: formatRupiah(summary.balance),
        hint: "Dana siap digunakan",
        icon: WalletCards,
    },
    {
        label: "Total Aset",
        value: formatRupiah(summary.totalAssets),
        hint: "Seluruh kepemilikan",
        icon: Landmark,
    },
    {
        label: "Nilai Portofolio",
        value: formatRupiah(summary.portfolioValue),
        hint: "Nilai pasar saat ini",
        icon: TrendingUp,
    },
    {
        label: "Financial Score",
        value: `${summary.financialScore} / 100`,
        hint: summary.financialScore
            ? "Terus bangun kebiasaan baik"
            : "Mulai dari investasi pertama",
        icon: Award,
    },
];
export default function SummaryCards({
    summary,
}: {
    summary: DashboardSummary;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards(summary).map(({ label, value, hint, icon: Icon }) => (
                <DashboardCard key={label} className="p-5">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-400">{label}</p>
                        <Icon size={18} className="text-cyan-300" />
                    </div>
                    <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                        {value}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{hint}</p>
                </DashboardCard>
            ))}
        </div>
    );
}
