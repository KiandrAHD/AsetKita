import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import { EmptyState } from "./State";
import { getLatestNews, getMarketSummary } from "@/services/dashboardService";
import type { MarketAsset, NewsItem } from "@/types/dashboard";
import {
    formatCompactRupiah,
    formatPercent,
    formatRupiah,
} from "@/utils/formatters";
export function MarketSummary() {
    const [assets, setAssets] = useState<MarketAsset[]>([]);
    useEffect(() => {
        void getMarketSummary().then(setAssets);
    }, []);
    return (
        <DashboardCard className="p-5 sm:p-6">
            <h2 className="font-semibold text-white">Market Summary</h2>
            <div className="mt-4 space-y-3">
                {assets.map((item) => (
                    <div
                        key={item.symbol}
                        className="border-b border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-white">{item.symbol}</p>
                                <p className="text-xs text-slate-400">{item.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-white">
                                    {formatRupiah(item.price)}
                                </p>
                                <p
                                    className={`text-xs ${item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                    {formatPercent(item.changePercent)}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                            Market cap {formatCompactRupiah(item.marketCap)} · Volume{" "}
                            {formatCompactRupiah(item.volume)}
                        </p>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
}
export function LatestNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(() => {
        setLoading(true);
        void getLatestNews()
            .then(setNews)
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load]);
    return (
        <DashboardCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Berita Terkini</h2>
                <button
                    onClick={load}
                    aria-label="Muat ulang berita"
                    className="text-slate-400 hover:text-cyan-300"
                >
                    <RefreshCw size={16} />
                </button>
            </div>
            {loading ? (
                <p className="py-8 text-center text-sm text-slate-400">
                    Memuat berita terbaru...
                </p>
            ) : news.length ? (
                <div className="mt-4 space-y-3">
                    {news.slice(0, 4).map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl bg-[#091321]/80 p-3 transition hover:bg-white/5"
                        >
                            <p className="flex gap-2 font-medium leading-5 text-slate-100">
                                <Newspaper
                                    className="mt-0.5 shrink-0 text-cyan-300"
                                    size={16}
                                />
                                {item.title}
                                <ExternalLink className="shrink-0 text-slate-500" size={14} />
                            </p>
                            <p className="mt-2 pl-6 text-xs text-slate-400">
                                {item.source} · {item.publishedAt}
                            </p>
                        </a>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Newspaper size={28} />}
                    title="Berita belum tersedia"
                    description="Kami akan menampilkan pembaruan pasar saat layanan berita tersedia."
                />
            )}
        </DashboardCard>
    );
}
