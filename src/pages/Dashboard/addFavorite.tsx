import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, Star } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { assets } from "@/data/assets";
import { auth } from "@/lib/firebase";
import { getMarketPrices, subscribeWatchlist, toggleWatchlist } from "@/services/marketService";
import type { AssetCategory, MarketPrice } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";

const categories: Array<"all" | AssetCategory> = ["all", "saham", "kripto", "logam"];

export default function AddFavorite() {
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
    const [favorites, setFavorites] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<"all" | AssetCategory>("all");

    useEffect(() => {
        void getMarketPrices().then(setPrices);
        const unsubscribe = subscribeWatchlist(auth.currentUser?.uid, (result) => setFavorites(result.assetIds));
        return unsubscribe;
    }, []);

    const rows = useMemo(() => assets.filter((asset) => {
        const matchesCategory = category === "all" || asset.category === category;
        const matchSearch = `${asset.name} ${asset.symbol}`.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchSearch;
    }), [category, search]);

    return (
        <PageFrame title="Tambah Favorit" description="Cari dan simpan aset favorit Anda secara realtime.">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-[#101C2F] px-3 text-slate-400">
                    <Search size={17} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari aset..." className="w-full bg-transparent py-3 text-sm outline-none" />
                </label>
                <div className="flex flex-wrap gap-2">
                    {categories.map((item) => (
                        <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm capitalize ${category === item ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"}`}>
                            {item === "all" ? "Semua" : item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                <Sparkles size={16} className="text-cyan-300" />
                <span>{rows.length} aset siap dipantau</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((asset) => {
                    const watched = favorites.includes(asset.id);
                    const price = prices[asset.id];
                    return (
                        <div key={asset.id} className="rounded-3xl border border-white/10 bg-[#101C2F] p-4 shadow-[0_0_40px_rgba(4,12,24,.18)]">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
                                    <p className="mt-1 text-sm text-slate-400">{asset.symbol} · {asset.category}</p>
                                </div>
                                <button onClick={() => void toggleWatchlist(auth.currentUser?.uid, asset.id).then((result) => setFavorites(result.assetIds))} className={`rounded-full border px-3 py-2 text-xs font-semibold ${watched ? "border-rose-400/25 bg-rose-400/10 text-rose-200" : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"}`}>
                                    {watched ? "Hapus Favorit" : "Tambah Favorit"}
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#08111F] px-3 py-3 text-sm">
                                <div>
                                    <p className="text-slate-400">Harga</p>
                                    <p className="mt-1 font-semibold text-white">{formatRupiah(price?.price ?? 0)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400">24 jam</p>
                                    <p className={`mt-1 font-semibold ${price?.changePercent && price.changePercent < 0 ? "text-rose-300" : "text-emerald-300"}`}>{formatPercent(price?.changePercent ?? 0)}</p>
                                </div>
                            </div>
                            <Link to={`/market/${asset.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                                <Star size={15} /> Lihat detail aset
                            </Link>
                        </div>
                    );
                })}
            </div>
        </PageFrame>
    );
}
