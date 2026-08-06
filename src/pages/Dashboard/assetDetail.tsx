import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowLeft, Star } from "lucide-react";
import PageFrame from "@/components/Dashboard/PageFrame";
import TradeModal from "@/components/Dashboard/TradeModal";
import { assets } from "@/data/assets";
import { getHistory, getMarketPrices, getWatchlist, toggleWatchlist } from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { MarketPrice, PriceHistoryPoint } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";

export default function AssetDetail() {
  const { assetId } = useParams(); const navigate = useNavigate(); const asset = assets.find((item) => item.id === assetId);
  const [price, setPrice] = useState<MarketPrice>(); const [history, setHistory] = useState<PriceHistoryPoint[]>([]); const [watched, setWatched] = useState(false); const [showTrade, setShowTrade] = useState(false);
  useEffect(() => { if (!asset) return; void Promise.all([getMarketPrices(), getHistory(asset.id), getWatchlist(auth.currentUser?.uid)]).then(([prices, chart, list]) => { setPrice(prices[asset.id]); setHistory(chart); setWatched(list.assetIds.includes(asset.id)); }); }, [asset]);
  if (!asset) return <PageFrame title="Aset tidak ditemukan" description="Kembali ke daftar market."><Link to="/market" className="text-cyan-300">Kembali ke Market</Link></PageFrame>;
  const updateWatchlist = () => void toggleWatchlist(auth.currentUser?.uid, asset.id).then((result) => setWatched(result.assetIds.includes(asset.id)));
  return <PageFrame title={asset.name} description={`${asset.symbol} · ${asset.category}`}>
    <div className="mb-5 flex items-center justify-between"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={17}/> Kembali</button><button onClick={updateWatchlist} className={watched ? "text-amber-300" : "text-slate-400"}><Star fill={watched ? "currentColor" : "none"}/></button></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]"><div className="rounded-2xl border border-white/10 bg-[#101b2a] p-5"><p className="text-sm text-slate-400">Harga saat ini</p><h2 className="mt-1 text-3xl font-bold">{formatRupiah(price?.price ?? 0)}</h2><p className={price?.changePercent && price.changePercent < 0 ? "mt-1 text-rose-300" : "mt-1 text-emerald-300"}>{formatPercent(price?.changePercent ?? 0)}</p><div className="mt-5 h-72"><ResponsiveContainer><AreaChart data={history}><XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#0b1220", border: "1px solid #334155" }}/><Area dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={.15}/></AreaChart></ResponsiveContainer></div></div>
    <aside className="rounded-2xl border border-white/10 bg-[#101b2a] p-5"><h3 className="font-semibold">Statistik Aset</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-400">Kategori</dt><dd className="capitalize">{asset.category}</dd></div><div className="flex justify-between"><dt className="text-slate-400">Satuan</dt><dd>{asset.unit}</dd></div><div className="flex justify-between"><dt className="text-slate-400">ATH sumber</dt><dd>{asset.currency === "USD" ? `$${asset.ath}` : formatRupiah(asset.ath)}</dd></div></dl><button onClick={() => setShowTrade(true)} className="mt-7 w-full rounded-xl bg-emerald-400 py-3 font-bold text-slate-950">Beli / Jual {asset.symbol}</button></aside></div>
    {showTrade && <TradeModal asset={asset} price={price?.price ?? 0} onClose={() => setShowTrade(false)} onDone={() => void getMarketPrices().then((result) => setPrice(result[asset.id]))}/>}</PageFrame>;
}
