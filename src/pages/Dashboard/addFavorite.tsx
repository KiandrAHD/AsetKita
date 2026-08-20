import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, Check, Plus, ArrowRight } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { assets } from "@/data/assets";
import { auth } from "@/lib/firebase";
import {
    getMarketPrices,
    getWatchlist,
    subscribeRealTimeMarketPrices,
    subscribeWatchlist,
    toggleWatchlist,
} from "@/services/marketService";
import type { AssetCategory, MarketPrice } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";
import { showToast } from "@/components/Dashboard/Toast";
import { EmptyState } from "@/components/Dashboard/State";

const categories: Array<{ id: "all" | AssetCategory; label: string }> = [
    { id: "all", label: "Semua" },
    { id: "saham", label: "Saham" },
    { id: "kripto", label: "Kripto" },
    { id: "logam", label: "Logam" },
];

export default function AddFavorite() {
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
    const [favorites, setFavorites] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<"all" | AssetCategory>("all");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        void getMarketPrices().then(setPrices);
        void getWatchlist(auth.currentUser?.uid).then((res) => setFavorites(res.assetIds));

        // Subscribe to real-time price updates
        const unsubPrices = subscribeRealTimeMarketPrices((pricesMap) => {
            setPrices(pricesMap);
        }, 3000);

        // Subscribe to watchlist changes
        const unsubWatchlist = subscribeWatchlist(auth.currentUser?.uid, (result) => {
            setFavorites(result.assetIds);
        });

        return () => {
            unsubPrices();
            unsubWatchlist();
        };
    }, []);

    // Perform case-insensitive search by name and ticker symbol, filtered by category
    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return assets.filter((asset) => {
            const matchesCategory = category === "all" || asset.category === category;
            const matchesSearch =
                !query ||
                asset.name.toLowerCase().includes(query) ||
                asset.symbol.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [category, search]);

    const handleToggleFavorite = async (assetId: string, assetName: string) => {
        setTogglingId(assetId);
        try {
            const isCurrentlyWatched = favorites.includes(assetId);
            const res = await toggleWatchlist(auth.currentUser?.uid, assetId);
            setFavorites(res.assetIds);

            if (isCurrentlyWatched) {
                showToast(`✓ ${assetName} dihapus dari Watchlist`, "info");
            } else {
                showToast(`✓ ${assetName} ditambahkan ke Watchlist`, "success");
            }
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <PageFrame title="Tambah Favorit" description="Cari dan simpan aset favorit Anda secara realtime.">
            {/* Search and Category Filters */}
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/10 bg-[#101C2F] px-4 text-slate-400 focus-within:border-cyan-400/50">
                    <Search size={18} className="text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="🔍 Cari nama atau symbol aset (e.g. NVDA, Apple, BTC)..."
                        className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder-slate-500 outline-none"
                    />
                </label>
                <div className="flex flex-wrap gap-2">
                    {categories.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCategory(item.id)}
                            className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                                category === item.id
                                    ? "bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset count badge */}
            <div className="mb-5 flex items-center justify-between text-sm text-slate-400">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-cyan-300" />
                    <span>{rows.length} aset siap dipantau</span>
                </div>
                {favorites.length > 0 && (
                    <Link to="/watchlist" className="text-xs font-medium text-cyan-300 hover:underline">
                        Lihat Watchlist ({favorites.length}) →
                    </Link>
                )}
            </div>

            {/* Asset Grid or Empty State */}
            {rows.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((asset) => {
                        const isWatched = favorites.includes(asset.id);
                        const price = prices[asset.id];
                        const isPositive = (price?.changePercent ?? 0) >= 0;
                        const isBusy = togglingId === asset.id;

                        return (
                            <div
                                key={asset.id}
                                className={`flex flex-col justify-between rounded-3xl border p-4 shadow-[0_0_40px_rgba(4,12,24,.18)] transition-all ${
                                    isWatched
                                        ? "border-cyan-500/30 bg-[#0e1d32]"
                                        : "border-white/10 bg-[#101C2F] hover:border-white/20 hover:bg-[#122238]"
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-white">{asset.name}</p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {asset.symbol} · <span className="capitalize">{asset.category}</span>
                                            </p>
                                        </div>

                                        {/* Favorit Toggle Button */}
                                        <button
                                            disabled={isBusy}
                                            onClick={() => void handleToggleFavorite(asset.id, asset.name)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                isWatched
                                                    ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-400/40"
                                                    : "bg-white/10 text-slate-200 border border-white/10 hover:bg-cyan-400 hover:text-slate-950"
                                            }`}
                                        >
                                            {isWatched ? (
                                                <>
                                                    <Check size={14} className="text-cyan-400" />
                                                    <span>✓ Favorit</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={14} />
                                                    <span>Tambah Favorit</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Price and 24h change */}
                                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#08111F] px-3.5 py-3 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Harga</p>
                                            <p className="mt-1 text-sm font-bold text-white">
                                                {formatRupiah(price?.price ?? asset.basePrice)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">24 jam</p>
                                            <p
                                                className={`mt-1 text-xs font-bold px-2 py-0.5 rounded ${
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

                                {/* Lihat Detail Link */}
                                <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between">
                                    <Link
                                        to={`/market/${asset.id}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                                    >
                                        <span>Lihat detail aset</span>
                                        <ArrowRight size={13} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-white/10 bg-[#101C2F] p-8 text-center">
                    {search ? (
                        <EmptyState
                            title="Aset tidak ditemukan"
                            description="Coba cari berdasarkan nama atau symbol aset."
                        />
                    ) : (
                        <EmptyState
                            title="Tidak ada aset pada kategori ini"
                            description="Pilih kategori lain untuk melihat daftar aset."
                        />
                    )}
                </div>
            )}
        </PageFrame>
    );
}
