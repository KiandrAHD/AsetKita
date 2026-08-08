import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { EmptyState } from "@/components/Dashboard/State";
import { assets } from "@/data/assets";
import {
    getMarketPrices,
    getWatchlist,
    subscribeWatchlist,
    toggleWatchlist,
} from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { MarketPrice } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";

export default function Watchlist() {
    const [ids, setIds] = useState<string[]>([]);
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});

    useEffect(() => {
        void Promise.all([
            getWatchlist(auth.currentUser?.uid),
            getMarketPrices(),
        ]).then(([watchlist, pricesMap]) => {
            setIds(watchlist.assetIds);
            setPrices(pricesMap);
        });
        const unsubscribe = subscribeWatchlist(auth.currentUser?.uid, (result) =>
            setIds(result.assetIds),
        );
        return unsubscribe;
    }, []);

    const rows = assets.filter((asset) => ids.includes(asset.id));

    return (
        <PageFrame title="Watchlist" description={`${rows.length} aset dipantau`}>
            <div className="mb-5 flex justify-end">
                <Link
                    to="/watchlist/add"
                    className="inline-flex items-center gap-2 rounded-full bg-[#13C8FF] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#30D6FF]"
                >
                    <Plus size={16} /> Tambah Favorit
                </Link>
            </div>
            {rows.length ? (
                <div className="space-y-3">
                    {rows.map((asset) => {
                        const price = prices[asset.id];
                        return (
                            <div
                                key={asset.id}
                                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101C2F] p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <Link to={`/market/${asset.id}`} className="min-w-0">
                                    <b className="block text-white">{asset.name}</b>
                                    <p className="text-sm text-slate-400">
                                        {asset.symbol} · {asset.category}
                                    </p>
                                </Link>
                                <div className="flex flex-wrap items-center gap-4 text-right">
                                    <span>
                                        <b className="block text-white">
                                            {formatRupiah(price?.price ?? 0)}
                                        </b>
                                        <small
                                            className={
                                                price?.changePercent && price.changePercent < 0
                                                    ? "text-rose-300"
                                                    : "text-emerald-300"
                                            }
                                        >
                                            {formatPercent(price?.changePercent ?? 0)}
                                        </small>
                                    </span>
                                    <button
                                        onClick={() =>
                                            void toggleWatchlist(
                                                auth.currentUser?.uid,
                                                asset.id,
                                            ).then((result) => setIds(result.assetIds))
                                        }
                                        className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-[#101C2F]">
                    <EmptyState
                        title="Watchlist masih kosong"
                        description="Tambahkan aset favorit dari halaman Tambah Favorit agar mudah dipantau."
                    />
                </div>
            )}
        </PageFrame>
    );
}
