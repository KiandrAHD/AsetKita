import { Link } from "react-router-dom";
import { TrendingUp, Wallet, Landmark, PiggyBank, Percent, ArrowUpRight } from "lucide-react";
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
            description="Nilai investasi dan performa aset Anda secara real-time."
        >
            {loading || !data ? (
                <LoadingState />
            ) : (
                <>
                    {/* Summary Cards Grid */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-4 sm:p-5 transition-all hover:border-white/20 hover:bg-[#132235]">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Saldo Cash</span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10">
                                    <Wallet size={15} className="text-cyan-400" />
                                </div>
                            </div>
                            <b className="mt-3 block text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
                                {formatRupiah(data.summary.balance)}
                            </b>
                            <p className="mt-1 text-xs text-slate-400 truncate">Siap diinvestasikan</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-4 sm:p-5 transition-all hover:border-white/20 hover:bg-[#132235]">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Total Aset</span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10">
                                    <Landmark size={15} className="text-emerald-400" />
                                </div>
                            </div>
                            <b className="mt-3 block text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
                                {formatRupiah(data.summary.totalAssets)}
                            </b>
                            <p className="mt-1 text-xs text-slate-400 truncate">Nilai pasar saat ini</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-4 sm:p-5 transition-all hover:border-white/20 hover:bg-[#132235]">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Nilai Portofolio</span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10">
                                    <TrendingUp size={15} className="text-cyan-300" />
                                </div>
                            </div>
                            <b className="mt-3 block text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-cyan-300 whitespace-nowrap truncate">
                                {formatRupiah(data.summary.portfolioValue)}
                            </b>
                            <p className="mt-1 text-xs text-slate-400 truncate">Saldo + Total Aset</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-4 sm:p-5 transition-all hover:border-white/20 hover:bg-[#132235]">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Modal Investasi</span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-400/10">
                                    <PiggyBank size={15} className="text-indigo-400" />
                                </div>
                            </div>
                            <b className="mt-3 block text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
                                {formatRupiah(data.summary.modalInvestasi)}
                            </b>
                            <p className="mt-1 text-xs text-slate-400 truncate">Cost basis pembelian</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-4 sm:p-5 transition-all hover:border-white/20 hover:bg-[#132235]">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Unrealized P/L</span>
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                    data.summary.unrealizedPnL >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10"
                                }`}>
                                    <ArrowUpRight
                                        size={15}
                                        className={data.summary.unrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}
                                    />
                                </div>
                            </div>
                            <b
                                className={`mt-3 block text-base sm:text-lg 2xl:text-xl font-bold tracking-tight whitespace-nowrap truncate ${
                                    data.summary.unrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                            >
                                {data.summary.unrealizedPnL > 0 ? "+" : ""}
                                {formatRupiah(data.summary.unrealizedPnL)}
                            </b>
                            <p className="mt-1 text-xs text-slate-400 truncate">Keuntungan / kerugian</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-4 sm:p-5 transition-all hover:border-white/20 hover:bg-[#132235]">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-xs font-medium">Total Return</span>
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                    data.summary.returnPercent >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10"
                                }`}>
                                    <Percent
                                        size={15}
                                        className={data.summary.returnPercent >= 0 ? "text-emerald-400" : "text-rose-400"}
                                    />
                                </div>
                            </div>
                            <b
                                className={`mt-3 block text-base sm:text-lg 2xl:text-xl font-bold tracking-tight whitespace-nowrap truncate ${
                                    data.summary.returnPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                            >
                                {formatPercent(data.summary.returnPercent)}
                            </b>
                            <p className="mt-1 text-xs text-slate-400 truncate">Persentase imbal hasil</p>
                        </div>
                    </div>

                    {/* Performance Chart & Dynamic Holdings List */}
                    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
                        <PortfolioChart data={data.chart} />

                        <div className="rounded-2xl border border-white/10 bg-[#101b2a] p-5">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div>
                                    <h2 className="font-semibold text-white text-lg">Portofolio Saya</h2>
                                    <p className="text-xs text-slate-400">Rincian kepemilikan aset aktif Anda</p>
                                </div>
                                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                    {data.holdings.length} Aset
                                </span>
                            </div>

                            {data.holdings.length ? (
                                <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                    {data.holdings.map((holding) => {
                                        const avgBuy = Number(holding.averageBuy) || Number(holding.price);
                                        const curPrice = Number(holding.price);
                                        const qty = Number(holding.quantity);
                                        const currentValue = qty * curPrice;
                                        const costBasis = qty * avgBuy;
                                        const pnl = currentValue - costBasis;
                                        const returnPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                                        return (
                                            <Link
                                                key={holding.id}
                                                to={`/market/${holding.assetId ?? holding.id}`}
                                                className="block rounded-2xl border border-white/5 bg-[#091321]/80 p-4 transition-all hover:border-cyan-400/40 hover:bg-[#0c182b]"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold"
                                                            style={{ color: holding.color, background: `${holding.color}22` }}
                                                        >
                                                            {holding.symbol.slice(0, 3)}
                                                        </span>
                                                        <div>
                                                            <h3 className="font-semibold text-white">{holding.name}</h3>
                                                            <span className="text-xs text-slate-400">
                                                                {qty.toLocaleString("id-ID", { maximumFractionDigits: 5 })} {holding.symbol}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-400 block">Current Value</span>
                                                        <b className="text-base font-semibold text-white block">
                                                            {formatRupiah(currentValue)}
                                                        </b>
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                                    <div>
                                                        <span className="text-slate-400 block">Avg Buy Price</span>
                                                        <span className="font-medium text-slate-200">{formatRupiah(avgBuy)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Current Price</span>
                                                        <span className="font-medium text-slate-200">{formatRupiah(curPrice)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Profit / Loss</span>
                                                        <span className={`font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                            {pnl > 0 ? "+" : ""}{formatRupiah(pnl)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Return</span>
                                                        <span className={`font-semibold ${returnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                            {formatPercent(returnPct)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8">
                                    <EmptyState
                                        title="Portofolio masih kosong"
                                        description="Beli aset pertama dari halaman Market untuk memulai investasi."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </PageFrame>
    );
}
