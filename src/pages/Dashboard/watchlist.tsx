import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageFrame from "@/components/Dashboard/PageFrame";
import { EmptyState } from "@/components/Dashboard/State";
import { assets } from "@/data/assets";
import { getMarketPrices, getWatchlist, toggleWatchlist } from "@/services/marketService";
import { auth } from "@/lib/firebase";
import type { MarketPrice } from "@/types/dashboard";
import { formatPercent, formatRupiah } from "@/utils/formatters";
export default function Watchlist() { const [ids, setIds] = useState<string[]>([]); const [prices, setPrices] = useState<Record<string, MarketPrice>>({}); useEffect(() => { void Promise.all([getWatchlist(auth.currentUser?.uid), getMarketPrices()]).then(([w,p]) => { setIds(w.assetIds); setPrices(p); }); }, []); const rows = assets.filter((asset) => ids.includes(asset.id)); return <PageFrame title="Watchlist" description={`${rows.length} aset dipantau`}>{rows.length ? <div className="space-y-3">{rows.map((asset) => { const price = prices[asset.id]; return <div key={asset.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101b2a] p-4"><Link to={`/market/${asset.id}`}><b>{asset.name}</b><p className="text-sm text-slate-400">{asset.symbol} · {asset.category}</p></Link><div className="flex items-center gap-4 text-right"><span><b className="block">{formatRupiah(price?.price ?? 0)}</b><small className={price?.changePercent && price.changePercent < 0 ? "text-rose-300" : "text-emerald-300"}>{formatPercent(price?.changePercent ?? 0)}</small></span><button onClick={() => void toggleWatchlist(auth.currentUser?.uid, asset.id).then((r) => setIds(r.assetIds))} className="text-sm text-rose-300">Hapus</button></div></div>; })}</div> : <div className="rounded-2xl border border-white/10 bg-[#101b2a]"><EmptyState title="Watchlist masih kosong" description="Tambahkan aset favorit dari halaman Market agar mudah dipantau."/></div>}</PageFrame>; }
