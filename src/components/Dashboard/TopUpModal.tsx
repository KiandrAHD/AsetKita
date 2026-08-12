import { useState } from "react";
import { X, PlusCircle, CheckCircle2, Wallet, QrCode, Building2, Smartphone } from "lucide-react";
import { formatRupiah } from "@/utils/formatters";
import { topUpBalance } from "@/services/walletService";

const presetAmounts = [100000, 500000, 1000000, 5000000, 10000000, 25000000];

const paymentMethods = [
  { id: "QRIS", name: "QRIS / Instant", icon: QrCode, desc: "BCA, GoPay, OVO, Dana, ShopeePay" },
  { id: "VA", name: "Virtual Account", icon: Building2, desc: "BCA, Mandiri, BNI, BRI" },
  { id: "EWALLET", name: "E-Wallet Direct", icon: Smartphone, desc: "GoPay, OVO, Dana" },
];

export default function TopUpModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1000000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("QRIS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const currentAmount = customAmount
    ? Number(customAmount.replace(/\D/g, ""))
    : selectedPreset ?? 0;

  const handlePresetSelect = (val: number) => {
    setSelectedPreset(val);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmount(raw);
    setSelectedPreset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (currentAmount < 10000) {
      return setError("Minimal top up adalah Rp 10.000.");
    }

    setLoading(true);
    try {
      await topUpBalance(currentAmount, method);
      setSuccessMsg(`Berhasil melakukan Top Up sebesar ${formatRupiah(currentAmount)}!`);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("");
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Gagal melakukan Top Up. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0c1626] p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Top Up Saldo</h2>
              <p className="text-xs text-slate-400">Tambah saldo investasi Anda secara instan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pilih Nominal Instan
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    selectedPreset === amt && !customAmount
                      ? "border-cyan-400 bg-cyan-400/15 text-cyan-300 shadow-sm shadow-cyan-400/20"
                      : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-cyan-400/40 hover:bg-white/5"
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Atau Masukkan Nominal Lain
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={customAmount ? Number(customAmount).toLocaleString("id-ID") : ""}
                onChange={handleCustomChange}
                placeholder="0"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-4 text-sm font-medium text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Metode Pembayaran
            </label>
            <div className="space-y-2">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-cyan-400 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={active ? "text-cyan-400" : "text-slate-400"} />
                      <div>
                        <p className="text-xs font-bold">{m.name}</p>
                        <p className="text-[11px] text-slate-400">{m.desc}</p>
                      </div>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        active ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                      }`}
                    >
                      {active && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback messages */}
          {error && <p className="text-xs font-medium text-red-400">{error}</p>}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || currentAmount <= 0}
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <PlusCircle size={15} />
                  <span>Top Up {formatRupiah(currentAmount)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
