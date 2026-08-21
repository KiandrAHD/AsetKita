import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowLeft, Share2, Star, Wallet } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import TradeModal from "@/components/Dashboard/TradeModal";
import { assets } from "@/data/assets";
import {
    getHistory,
    getMarketPrices,
    getWatchlist,
    subscribeRealTimeMarketPrices,
    subscribeWatchlist,
    toggleWatchlist,
} from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { Holding, MarketPrice, PriceHistoryPoint, TimeFrame } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";
import { showToast } from "@/components/Dashboard/Toast";
import { useDashboard } from "@/hooks/useDashboard";

const detailMap: Record<string, { label: string; value: string }[]> = {
    aapl: [{ label: "Sektor", value: "Teknologi" }, { label: "Negara", value: "Amerika Serikat" }, { label: "Ticker", value: "AAPL" }],
    btc: [{ label: "Blockchain", value: "Bitcoin" }, { label: "Consensus", value: "Proof of Work" }, { label: "Circulating Supply", value: "19.8M BTC" }],
    xau: [{ label: "Purity", value: ".999" }, { label: "Unit", value: "oz" }, { label: "Negara Produksi", value: "Australia" }],
};

const timeframes: { id: TimeFrame; label: string }[] = [
    { id: "1D", label: "Hari Ini" },
    { id: "1W", label: "1 M" },
    { id: "1M", label: "1 B" },
    { id: "1Y", label: "1 T" },
    { id: "10Y", label: "10 T" },
    { id: "MAX", label: "Max" },
];

export default function AssetDetail() {
    const { assetId } = useParams();
    const navigate = useNavigate();
    const asset = assets.find((item) => item.id === assetId);
    const { data: dashboardData } = useDashboard(auth.currentUser);

    const [price, setPrice] = useState<MarketPrice>();
    const [timeframe, setTimeframe] = useState<TimeFrame>("1M");
    const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
    const [watched, setWatched] = useState(false);
    const [showTrade, setShowTrade] = useState(false);

    useEffect(() => {
        if (!asset) return;

        // Fetch initial watchlist state
        void getWatchlist(auth.currentUser?.uid).then((list) => {
            setWatched(list.assetIds.includes(asset.id));
        });

        // Real-time price updates & chart calculations
        const unsubPrices = subscribeRealTimeMarketPrices((prices) => {
            const currentLive = prices[asset.id];
            if (currentLive) {
                setPrice(currentLive);
                setHistory(getHistory(asset.id, currentLive.price, timeframe));
            }
        }, 3000);

        // Real-time watchlist subscription
        const unsubWatchlist = subscribeWatchlist(auth.currentUser?.uid, (list) => {
            setWatched(list.assetIds.includes(asset.id));
        });

        return () => {
            unsubPrices();
            unsubWatchlist();
        };
    }, [asset, timeframe]);

    useEffect(() => {
        if (!asset) return;
        const currentPriceVal = price?.price ?? asset.basePrice;
        setHistory(getHistory(asset.id, currentPriceVal, timeframe));

        const handleHistoryUpdate = (e: Event) => {
            const customEv = e as CustomEvent<{ assetId: string; timeframe: TimeFrame }>;
            if (customEv.detail?.assetId === asset.id && customEv.detail?.timeframe === timeframe) {
                setHistory(getHistory(asset.id, currentPriceVal, timeframe));
            }
        };

        window.addEventListener("asetkita-history-updated", handleHistoryUpdate);
        return () => {
            window.removeEventListener("asetkita-history-updated", handleHistoryUpdate);
        };
    }, [asset, timeframe, price]);

    const meta = useMemo(
        () =>
            detailMap[asset?.id ?? ""] ?? [
                { label: "Sektor", value: asset?.category ?? "Investasi" },
                { label: "Negara", value: "Global" },
                { label: "Ticker", value: asset?.symbol ?? "-" },
            ],
        [asset],
    );

    // Check if current user owns this asset in portfolio holdings
    const userHolding = useMemo<Holding | undefined>(() => {
        if (!dashboardData?.holdings || !asset) return undefined;
        return dashboardData.holdings.find(
            (h) => (h.assetId ?? h.id) === asset.id || h.symbol === asset.symbol,
        );
    }, [dashboardData, asset]);

    if (!asset) {
        return (
            <PageFrame title="Aset tidak ditemukan" description="Kembali ke daftar market.">
                <Link to="/market" className="text-cyan-300">
                    Kembali ke Market
                </Link>
            </PageFrame>
        );
    }

    const updateWatchlist = async () => {
        const result = await toggleWatchlist(auth.currentUser?.uid, asset.id);
        const isNowWatched = result.assetIds.includes(asset.id);
        setWatched(isNowWatched);
        if (isNowWatched) {
            showToast(`✓ ${asset.name} ditambahkan ke Watchlist`, "success");
        } else {
            showToast(`✓ ${asset.name} dihapus dari Watchlist`, "info");
        }
    };

    const rangeHigh = useMemo(() => {
        if (!history.length) return price?.price ?? asset.basePrice;
        return Math.max(...history.map((h) => h.value));
    }, [history, price, asset]);

    const rangeLow = useMemo(() => {
        if (!history.length) return price?.price ?? asset.basePrice;
        return Math.min(...history.map((h) => h.value));
    }, [history, price, asset]);

    const isPositive = (price?.changePercent ?? 0) >= 0;

    return (
        <PageFrame title={asset.name} description={`${asset.symbol} · ${asset.category}`}>
            {/* Header Controls */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft size={17} /> Kembali
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void updateWatchlist()}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            watched
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                                : "border-white/10 bg-[#101C2F] text-slate-300 hover:border-white/20 hover:text-white"
                        }`}
                    >
                        <Star size={16} className={watched ? "fill-amber-400 text-amber-400" : ""} />
                        <span>{watched ? "Favorit" : "Tambah Favorit"}</span>
                    </button>
                    <button className="rounded-full border border-white/10 bg-[#101C2F] p-2.5 text-slate-300 hover:text-white">
                        <Share2 size={16} />
                    </button>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                {/* Main Content Area: Price & Chart */}
                <div className="rounded-[2rem] border border-white/10 bg-[#101C2F] p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-slate-400">Harga Real-Time</p>
                            <h2 className="mt-1 text-3xl font-bold text-white">
                                {formatRupiah(price?.price ?? asset.basePrice)}
                            </h2>
                            <p
                                className={`mt-2 inline-block rounded-md px-2.5 py-0.5 text-xs font-bold ${
                                    isPositive
                                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                        : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                }`}
                            >
                                {formatPercent(price?.changePercent ?? 0)} hari ini
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#1F3557] bg-[#08111F] px-4 py-3 text-sm text-slate-300">
                            <p className="text-xs text-slate-400">Estimasi Volume</p>
                            <p className="mt-1 font-semibold text-white">
                                {formatRupiah((price?.price ?? asset.basePrice) * 100000)}
                            </p>
                        </div>
                    </div>

                    {/* Timeframe Selector Pill Controls */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1F3557] bg-[#08111F] p-2">
                        <div className="flex items-center gap-1 overflow-x-auto">
                            {timeframes.map((tf) => (
                                <button
                                    key={tf.id}
                                    onClick={() => setTimeframe(tf.id)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                        timeframe === tf.id
                                            ? "bg-[#13C8FF] text-slate-950 shadow-md font-bold"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 px-2 text-xs font-medium text-slate-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 font-semibold">LIVE</span>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="mt-4 h-72 rounded-2xl border border-[#1F3557] bg-[#08111F] p-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={45} />
                                <Tooltip
                                    formatter={(value) => [formatRupiah(Number(value)), "Harga"]}
                                    contentStyle={{ background: "#08111F", border: "1px solid #1F3557", borderRadius: "12px" }}
                                />
                                <Area dataKey="value" stroke="#13C8FF" strokeWidth={2} fill="#13C8FF" fillOpacity={0.16} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Asset Statistics Cards */}
                    <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                        <div className="rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                            <p className="text-xs text-slate-400">Tertinggi ({timeframe})</p>
                            <p className="mt-1 font-semibold text-emerald-400 text-base">{formatRupiah(rangeHigh)}</p>
                        </div>
                        <div className="rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                            <p className="text-xs text-slate-400">Terendah ({timeframe})</p>
                            <p className="mt-1 font-semibold text-rose-400 text-base">{formatRupiah(rangeLow)}</p>
                        </div>
                        <div className="rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                            <p className="text-xs text-slate-400">ATH (Puncak Harga)</p>
                            <p className="mt-1 font-semibold text-amber-400 text-base">{formatRupiah(asset.ath)}</p>
                        </div>
                        <div className="rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                            <p className="text-xs text-slate-400">Market Cap</p>
                            <p className="mt-1 font-semibold text-white text-base">{formatRupiah((price?.price ?? asset.basePrice) * 2500000)}</p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-[#1F3557] bg-[#08111F] p-4">
                        <p className="text-sm font-semibold text-white">Deskripsi Aset</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            {asset.name} ({asset.symbol}) adalah aset instrumen {asset.category} yang dapat Anda pantau di Watchlist dan transaksikan secara simulasi di platform AsetKita.
                        </p>
                    </div>
                </div>

                {/* Sidebar Column: Ownership, Stats & Actions */}
                <aside className="space-y-5">
                    {/* User Holding Info Card (If user owns this asset) */}
                    {userHolding && (
                        <div className="rounded-[2rem] border border-emerald-500/30 bg-[#091a18] p-5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <Wallet size={16} />
                                <span>Aset Di Portofolio Anda</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-slate-400">Jumlah Dimiliki</p>
                                    <b className="mt-1 block text-base font-bold text-white">
                                        {Number(userHolding.quantity).toLocaleString("id-ID", { maximumFractionDigits: 4 })} {asset.unit}
                                    </b>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Nilai Saat Ini</p>
                                    <b className="mt-1 block text-base font-bold text-emerald-400">
                                        {formatRupiah(Number(userHolding.quantity) * (price?.price ?? asset.basePrice))}
                                    </b>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Rata-rata Beli</p>
                                    <p className="mt-1 font-semibold text-slate-200">
                                        {formatRupiah(Number(userHolding.averageBuy ?? price?.price ?? asset.basePrice))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Status Watchlist</p>
                                    <p className="mt-1 font-semibold text-amber-400">
                                        {watched ? "Dipantau ⭐" : "Tidak dipantau"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trade / Action Card */}
                    <div className="rounded-[2rem] border border-white/10 bg-[#101C2F] p-5">
                        <h3 className="text-lg font-semibold text-white">Transaksi & Statistik</h3>
                        <div className="mt-4 space-y-3 text-sm">
                            {meta.map((item) => (
                                <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-none last:pb-0">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className="font-semibold text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowTrade(true)}
                                className="flex-1 rounded-2xl bg-[#13C8FF] px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#30D6FF] shadow-[0_0_20px_rgba(19,200,255,0.25)]"
                            >
                                Beli Aset
                            </button>
                            {userHolding && (
                                <button
                                    onClick={() => setShowTrade(true)}
                                    className="flex-1 rounded-2xl border border-[#1F3557] bg-transparent px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
                                >
                                    Jual Aset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Recent Price History */}
                    <div className="rounded-[2rem] border border-white/10 bg-[#101C2F] p-5">
                        <h3 className="text-lg font-semibold text-white">Riwayat Harga</h3>
                        <div className="mt-4 space-y-2.5 text-sm text-slate-400">
                            {history.slice(-4).reverse().map((item) => (
                                <div key={`${item.label}-${item.value}`} className="flex items-center justify-between rounded-xl border border-[#1F3557] bg-[#08111F] px-3.5 py-2.5">
                                    <span>{item.label}</span>
                                    <span className="font-semibold text-white">{formatRupiah(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* BUY / SELL Modal */}
            {showTrade && (
                <TradeModal
                    asset={asset}
                    price={price?.price ?? asset.basePrice}
                    onClose={() => setShowTrade(false)}
                    onDone={() => void getMarketPrices().then((result) => setPrice(result[asset.id]))}
                />
            )}
        </PageFrame>
    );
}
