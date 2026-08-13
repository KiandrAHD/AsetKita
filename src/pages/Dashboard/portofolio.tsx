import { Link } from "react-router-dom";
import PageFrame from "@/components/Dashboard/PageFrame";
import { auth } from "@/lib/firebase";
import { useDashboard } from "@/hooks/useDashboard";
import { PortfolioChart } from "@/components/Dashboard/Charts";
import { EmptyState, LoadingState } from "@/components/Dashboard/State";
import { formatPercent, formatRupiah } from "@/utils/formatters";
export default function Portfolio() {
    const { data, loading } = useDashboard(auth.currentUser);
    return (
        <PageFrame
            title="Portofolio"
            description="Nilai investasi dan performa aset Anda."
        >
            {loading || !data ? (
                <LoadingState />
            ) : (
                <>
                    <div className="mb-5 grid gap-4 sm:grid-cols-3">
                        {[
                            ["Nilai Portofolio", data.summary.portfolioValue],
                            ["Saldo", data.summary.balance],
                            ["Total Aset", data.summary.totalAssets],
                        ].map(([label, value]) => (
                            <div
                                key={String(label)}
                                className="rounded-2xl border border-white/10 bg-[#101b2a] p-5"
                            >
                                <p className="text-sm text-slate-400">{label}</p>
                                <b className="mt-2 block text-xl">
                                    {formatRupiah(Number(value))}
                                </b>
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
                        <PortfolioChart data={data.chart} />
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b2a]">
                            <h2 className="p-5 font-semibold">Investments</h2>
                            {data.holdings.length ? (
                                data.holdings.map((holding) => (
                                    <Link
                                        key={holding.id}
                                        to={`/market/${holding.assetId ?? holding.id}`}
                                        className="flex items-center justify-between border-t border-white/5 px-5 py-4"
                                    >
                                        <span>
                                            <b>{holding.name}</b>
                                            <small className="ml-2 text-slate-400">
                                                {holding.quantity} {holding.symbol}
                                            </small>
                                        </span>
                                        <span className="text-right">
                                            <b className="block">
                                                {formatRupiah(holding.quantity * holding.price)}
                                            </b>
                                            <small
                                                className={
                                                    holding.changePercent < 0
                                                        ? "text-rose-300"
                                                        : "text-emerald-300"
                                                }
                                            >
                                                {formatPercent(holding.changePercent)}
                                            </small>
                                        </span>
                                    </Link>
                                ))
                            ) : (
                                <EmptyState
                                    title="Portofolio masih kosong"
                                    description="Beli aset pertama dari halaman Market untuk memulai investasi."
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </PageFrame>
    );
}
