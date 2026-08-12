import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowLeft, Share2, Star } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import TradeModal from "@/components/Dashboard/TradeModal";
import { assets } from "@/data/assets";
import { getHistory, getMarketPrices, getWatchlist, subscribeRealTimeMarketPrices, toggleWatchlist } from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { MarketPrice, PriceHistoryPoint } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";

const detailMap: Record<string, { label: string; value: string }[]> = {
    aapl: [{ label: "Sektor", value: "Teknologi" }, { label: "Negara", value: "Amerika Serikat" }, { label: "Ticker", value: "AAPL" }],
    btc: [{ label: "Blockchain", value: "Bitcoin" }, { label: "Consensus", value: "Proof of Work" }, { label: "Circulating Supply", value: "19.8M BTC" }],
    xau: [{ label: "Purity", value: ".999" }, { label: "Unit", value: "oz" }, { label: "Negara Produksi", value: "Australia" }],
};

export default function AssetDetail() {
    const { assetId } = useParams();
    const navigate = useNavigate();
    const asset = assets.find((item) => item.id === assetId);
    const [price, setPrice] = useState<MarketPrice>();
    const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
    const [watched, setWatched] = useState(false);
    const [showTrade, setShowTrade] = useState(false);

    useEffect(() => {
        if (!asset) return;

        // Subscribe to real-time market updates
        const unsubscribe = subscribeRealTimeMarketPrices((prices) => {
            const currentLive = prices[asset.id];
            if (currentLive) {
                setPrice(currentLive);
                setHistory(getHistory(asset.id, currentLive.price));
            }
        }, 3000);

        void getWatchlist(auth.currentUser?.uid).then((list) => {
            setWatched(list.assetIds.includes(asset.id));
        });

        return () => unsubscribe();
    }, [asset]);

    const meta = useMemo(() => detailMap[asset?.id ?? ""] ?? [{ label: "Sektor", value: asset?.category ?? "Investasi" }, { label: "Negara", value: "Global" }, { label: "Ticker", value: asset?.symbol ?? "-" }], [asset]);

    if (!asset) return <PageFrame title="Aset tidak ditemukan" description="Kembali ke daftar market."><Link to="/market" className="text-cyan-300">Kembali ke Market</Link></PageFrame>;

    const updateWatchlist = () => void toggleWatchlist(auth.currentUser?.uid, asset.id).then((result) => setWatched(result.assetIds.includes(asset.id)));

    return (
        <PageFrame title={asset.name} description={`${asset.symbol} · ${asset.category}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={17} /> Kembali</button>
                <div className="flex items-center gap-2">
                    <button onClick={updateWatchlist} className={`rounded-full border px-3 py-2 text-sm ${watched ? "border-amber-400/25 bg-amber-400/10 text-amber-200" : "border-white/10 bg-[#101C2F] text-slate-300"}`}><Star size={15} className={watched ? "fill-current" : ""} /></button>
                    <button className="rounded-full border border-white/10 bg-[#101C2F] px-3 py-2 text-sm text-slate-300"><Share2 size={15} /></button>
                </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] border border-white/10 bg-[#101C2F] p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-slate-400">Overview</p>
                            <h2 className="mt-2 text-3xl font-semibold text-white">{formatRupiah(price?.price ?? 0)}</h2>
                            <p className={price?.changePercent && price.changePercent < 0 ? "mt-2 text-rose-300" : "mt-2 text-emerald-300"}>{formatPercent(price?.changePercent ?? 0)} hari ini</p>
                        </div>
                        <div className="rounded-2xl border border-[#1F3557] bg-[#08111F] px-4 py-3 text-sm text-slate-300">
                            <p className="text-slate-400">Volume</p>
                            <p className="mt-1 font-semibold text-white">{formatRupiah(price?.price ? price.price * 100000 : 0)}</p>
                        </div>
                    </div>
                    <div className="mt-6 h-72 rounded-2xl border border-[#1F3557] bg-[#08111F] p-3">
                        <ResponsiveContainer>
                            <AreaChart data={history}>
                                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#08111F", border: "1px solid #1F3557" }} />
                                <Area dataKey="value" stroke="#13C8FF" fill="#13C8FF" fillOpacity={0.16} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {[
                            { label: "Market Cap", value: formatRupiah(price?.price ? price.price * 2500000 : 0) },
                            { label: "Supply", value: asset.category === "kripto" ? "21.0M" : "Liquid" },
                            { label: "ATH", value: asset.currency === "USD" ? `$${asset.ath}` : formatRupiah(asset.ath) },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                                <p className="text-sm text-slate-400">{item.label}</p>
                                <p className="mt-2 font-semibold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                        <p className="text-sm font-semibold text-white">Deskripsi Aset</p>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{asset.name} adalah aset yang tersedia di pasar simulasi AsetKita dengan akses cepat, pemantauan harga, dan transaksi yang terintegrasi dengan dashboard Anda.</p>
                    </div>
                </div>
                <aside className="space-y-5">
                    <div className="rounded-[2rem] border border-white/10 bg-[#101C2F] p-5">
                        <h3 className="text-lg font-semibold text-white">Statistik</h3>
                        <div className="mt-4 space-y-3 text-sm">
                            {meta.map((item) => (
                                <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-none last:pb-0">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className="font-semibold text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <button onClick={() => setShowTrade(true)} className="flex-1 rounded-2xl bg-[#13C8FF] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#30D6FF]">Beli</button>
                            <button onClick={() => setShowTrade(true)} className="flex-1 rounded-2xl border border-[#1F3557] bg-transparent px-4 py-3 text-sm font-semibold text-slate-300">Jual</button>
                        </div>
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-[#101C2F] p-5">
                        <h3 className="text-lg font-semibold text-white">Riwayat Harga</h3>
                        <div className="mt-4 space-y-3 text-sm text-slate-400">
                            {history.slice(-4).reverse().map((item) => (
                                <div key={`${item.label}-${item.value}`} className="flex items-center justify-between rounded-2xl border border-[#1F3557] bg-[#08111F] px-3 py-3">
                                    <span>{item.label}</span>
                                    <span className="font-semibold text-white">{formatRupiah(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
            {showTrade && <TradeModal asset={asset} price={price?.price ?? 0} onClose={() => setShowTrade(false)} onDone={() => void getMarketPrices().then((result) => setPrice(result[asset.id]))} />}
        </PageFrame>
    );
}
