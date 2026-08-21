import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Star, ArrowRight, Trash2 } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { EmptyState } from "@/components/Dashboard/State";
import { assets } from "@/data/assets";
import {
    getWatchlist,
    subscribeRealTimeMarketPrices,
    subscribeWatchlist,
    toggleWatchlist,
} from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { MarketPrice } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";
import { showToast } from "@/components/Dashboard/Toast";

export default function Watchlist() {
    const [ids, setIds] = useState<string[]>([]);
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void getWatchlist(auth.currentUser?.uid).then((watchlist) => {
            setIds(watchlist.assetIds);
            setLoading(false);
        });

        // Real-time market prices ticker
        const unsubPrices = subscribeRealTimeMarketPrices((pricesMap) => {
            setPrices(pricesMap);
        }, 3000);

        // Real-time watchlist subscription
        const unsubWatchlist = subscribeWatchlist(auth.currentUser?.uid, (result) => {
            setIds(result.assetIds);
        });

        return () => {
            unsubPrices();
            unsubWatchlist();
        };
    }, []);

    const handleRemove = async (assetId: string, assetName: string) => {
        const res = await toggleWatchlist(auth.currentUser?.uid, assetId);
        setIds(res.assetIds);
        showToast(`✓ ${assetName} dihapus dari Watchlist`, "info");
    };

    const rows = assets.filter((asset) => ids.includes(asset.id));

    return (
        <PageFrame
            title="Watchlist"
            description={`${rows.length} aset dipantau`}
        >
            {/* Header Action Button */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-medium text-slate-400">Daftar Pantauan Aset Anda</h2>
                </div>
                <Link
                    to="/watchlist/add"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#13C8FF] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[#30D6FF] shadow-[0_0_20px_rgba(19,200,255,0.2)]"
                >
                    <Plus size={18} />
                    <span>Tambah Favorit</span>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="text-sm text-slate-400">Memuat Watchlist...</span>
                </div>
            ) : rows.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {rows.map((asset) => {
                        const price = prices[asset.id];
                        const isPositive = (price?.changePercent ?? 0) >= 0;

                        return (
                            <div
                                key={asset.id}
                                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#101C2F] p-5 shadow-[0_0_40px_rgba(4,12,24,.18)] transition-all hover:border-cyan-400/30 hover:bg-[#122238]"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <b className="block truncate text-base font-bold text-white group-hover:text-cyan-300 transition">
                                                {asset.name}
                                            </b>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {asset.symbol} · <span className="capitalize">{asset.category}</span>
                                            </p>
                                        </div>

                                        <button
                                            aria-label={`Hapus ${asset.name} dari Watchlist`}
                                            onClick={() => void handleRemove(asset.id, asset.name)}
                                            className="rounded-full border border-rose-400/20 bg-rose-400/10 p-2 text-rose-300 transition hover:bg-rose-400/20 hover:text-rose-200"
                                            title="Hapus dari Watchlist"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Price & Change Box */}
                                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/5 bg-[#08111F] px-4 py-3 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Harga Saat Ini</p>
                                            <p className="mt-1 text-base font-bold text-white">
                                                {formatRupiah(price?.price ?? asset.basePrice)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">24 Jam</p>
                                            <p
                                                className={`mt-1 font-bold text-xs sm:text-sm px-2 py-0.5 rounded ${
                                                    isPositive
                                                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                                        : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                                }`}
                                            >
                                                {formatPercent(price?.changePercent ?? 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Link */}
                                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <Link
                                        to={`/market/${asset.id}`}
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 transition group-hover:text-cyan-200"
                                    >
                                        <span>Lihat Detail</span>
                                        <ArrowRight size={14} />
                                    </Link>

                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Star size={12} className="text-amber-400 fill-amber-400" />
                                        <span>Dipantau</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-white/10 bg-[#101C2F] p-8 text-center shadow-[0_0_40px_rgba(4,12,24,.18)]">
                    <EmptyState
                        title="Watchlist masih kosong"
                        description="Tambahkan aset favorit dari halaman Tambah Favorit agar mudah dipantau."
                    />
                    <div className="mt-6 flex justify-center">
                        <Link
                            to="/watchlist/add"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#13C8FF] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#30D6FF]"
                        >
                            <Plus size={18} />
                            <span>+ Tambah Favorit</span>
                        </Link>
                    </div>
                </div>
            )}
        </PageFrame>
    );
}
