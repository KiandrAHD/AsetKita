import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, RefreshCw } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { assets } from "@/data/assets";
import {
    getMarketPrices,
    getWatchlist,
    subscribeRealTimeMarketPrices,
    toggleWatchlist,
} from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { AssetCategory, MarketPrice } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";

export default function Market() {
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<"all" | AssetCategory>("all");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>("Baru saja");

    useEffect(() => {
        // Fetch watchlist once
        void getWatchlist(auth.currentUser?.uid).then((nextWatchlist) => {
            setWatchlist(nextWatchlist.assetIds);
        });

        // Subscribe to real-time prices (auto update every 3s)
        const unsubscribe = subscribeRealTimeMarketPrices((nextPrices) => {
            setPrices(nextPrices);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }, 3000);

        return () => unsubscribe();
    }, []);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        const freshPrices = await getMarketPrices();
        setPrices({ ...freshPrices });
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setIsRefreshing(false);
    };

    const rows = useMemo(
        () =>
            assets.filter(
                (asset) =>
                    (category === "all" || asset.category === category) &&
                    `${asset.name} ${asset.symbol}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
            ),
        [category, search],
    );

    return (
        <PageFrame
            title="Market (Pasar Real-Time)"
            description="Harga aset ter-update otomatis secara real-time dari bursa & pasar kripto dunia nyata."
        >
            {/* Live Indicator & Controls Header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>LIVE DATA (Real-Time API)</span>
                    </div>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                        Update terakhir: <b className="text-slate-200">{lastUpdated}</b>
                    </span>
                </div>

                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>{isRefreshing ? "Memperbarui..." : "Refresh Harga"}</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#101b2a] px-3 text-slate-400">
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari aset saham, kripto, atau logam..."
                        className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder-slate-500 outline-none"
                    />
                </label>
                <div className="flex gap-2 overflow-x-auto">
                    {(["all", "saham", "kripto", "logam"] as const).map((item) => (
                        <button
                            key={item}
                            onClick={() => setCategory(item)}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                                category === item ? "bg-cyan-400 text-slate-950 shadow font-bold" : "bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                        >
                            {item === "all" ? "Semua Aset" : item}
                        </button>
                    ))}
                </div>
            </div>

            {/* Market Table */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b2a]">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 px-4 py-3 text-xs font-medium text-slate-400 sm:grid-cols-[1fr_150px_110px_80px]">
                    <span>Aset & Ticker</span>
                    <span>Harga Real-Time</span>
                    <span>Perubahan 24 Jam</span>
                    <span className="hidden sm:block">Favorit</span>
                </div>
                {rows.map((asset) => {
                    const price = prices[asset.id];
                    const watched = watchlist.includes(asset.id);
                    const isPositive = (price?.changePercent ?? 0) >= 0;

                    return (
                        <div
                            key={asset.id}
                            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/5 px-4 py-4 last:border-0 hover:bg-white/[0.02] transition sm:grid-cols-[1fr_150px_110px_80px]"
                        >
                            <Link to={`/market/${asset.id}`} className="min-w-0 group">
                                <b className="block truncate text-sm text-white group-hover:text-cyan-400 transition">
                                    {asset.name}
                                </b>
                                <span className="text-xs text-slate-400">
                                    {asset.symbol} · <span className="capitalize">{asset.category}</span>
                                </span>
                            </Link>
                            <div>
                                <b className="text-sm font-bold text-slate-100">
                                    {formatRupiah(price?.price ?? 0)}
                                </b>
                            </div>
                            <div>
                                <span
                                    className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
                                        isPositive
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    }`}
                                >
                                    {formatPercent(price?.changePercent ?? 0)}
                                </span>
                            </div>
                            <button
                                aria-label="Toggle favorit"
                                onClick={() =>
                                    void toggleWatchlist(auth.currentUser?.uid, asset.id).then(
                                        (r) => setWatchlist(r.assetIds),
                                    )
                                }
                                className={`hidden rounded-lg p-2 sm:block transition ${watched ? "text-amber-400 hover:text-amber-300" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                <Star size={18} fill={watched ? "currentColor" : "none"} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </PageFrame>
    );
}
