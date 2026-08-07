import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Asset, TradeSide } from "@/types/dashboard";
import { formatRupiah } from "@/utils/formatters";
import { trade } from "@/services/marketService";
import { auth } from "@/lib/firebase";

export default function TradeModal({ asset, price, onClose, onDone }: { asset: Asset; price: number; onClose: () => void; onDone: () => void }) {
    const [side, setSide] = useState<TradeSide>("buy");
    const [quantity, setQuantity] = useState("1");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState("");

    const total = useMemo(() => (Number(quantity) || 0) * price, [price, quantity]);

    const submit = async () => {
        setBusy(true);
        setError("");
        setSuccess("");
        try {
            await trade(auth.currentUser?.uid, asset, side, Number(quantity), price);
            setSuccess(side === "buy" ? `Pembelian ${asset.symbol} berhasil diproses.` : `Penjualan ${asset.symbol} berhasil diproses.`);
            onDone();
            window.setTimeout(onClose, 700);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Transaksi gagal diproses.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060B16]/85 p-4">
            <div className="w-full max-w-lg rounded-[2rem] border border-[#1F3557] bg-[#101C2F] p-5 shadow-[0_0_80px_rgba(19,200,255,.14)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[.2em] text-cyan-300">{asset.symbol}</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{side === "buy" ? "Beli" : "Jual"} {asset.name}</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-400 hover:text-white">Tutup</button>
                </div>
                <div className="mt-5 flex gap-2 rounded-2xl border border-[#1F3557] bg-[#08111F] p-1">
                    <button onClick={() => setSide("buy")} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${side === "buy" ? "bg-[#13C8FF] text-slate-950" : "text-slate-400 hover:text-white"}`}>Beli</button>
                    <button onClick={() => setSide("sell")} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${side === "sell" ? "bg-[#13C8FF] text-slate-950" : "text-slate-400 hover:text-white"}`}>Jual</button>
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl border border-[#1F3557] bg-[#08111F] p-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between"><span className="text-slate-400">Harga sekarang</span><span className="font-semibold text-white">{formatRupiah(price)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400">Kategori</span><span className="font-semibold text-white">{asset.category}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400">Saldo tersedia</span><span className="font-semibold text-cyan-300">{formatRupiah(0)}</span></div>
                </div>
                <label className="mt-5 block text-sm text-slate-300">Jumlah ({asset.unit})<input autoFocus inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#1F3557] bg-[#08111F] px-4 py-3 text-white outline-none transition focus:border-[#30D6FF]" /></label>
                <div className="mt-4 grid gap-3 rounded-2xl border border-[#1F3557] bg-[#08111F] p-4 text-sm"><div className="flex items-center justify-between"><span className="text-slate-400">Estimasi total</span><span className="font-semibold text-white">{formatRupiah(total)}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Biaya transaksi</span><span className="font-semibold text-white">{formatRupiah(Math.max(total * 0.001, 1000))}</span></div></div>
                {error && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-3 text-sm text-rose-200"><XCircle size={16} />{error}</div>}
                {success && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-200"><CheckCircle2 size={16} />{success}</div>}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={submit} disabled={busy} className="flex-1 rounded-2xl bg-[#13C8FF] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#30D6FF] disabled:opacity-60">{busy ? "Memproses..." : side === "buy" ? "Beli" : "Jual"}</button><button onClick={onClose} className="flex-1 rounded-2xl border border-[#1F3557] bg-transparent px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white">Batal</button></div>
            </div>
        </div>
    );
}
