import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { saveDemoSession } from "@/services/demoService";
const balances = [100000, 250000, 500000, 750000, 1000000];
const format = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
export default function Demo() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [nickname, setNickname] = useState("");
    const [balance, setBalance] = useState(500000);
    const [error, setError] = useState("");
    const next = (event: React.FormEvent) => {
        event.preventDefault();
        if (nickname.trim().length < 2)
            return setError("Nama panggilan minimal 2 karakter.");
        setError("");
        setStep(2);
    };
    const start = () => {
        saveDemoSession({
            nickname: nickname.trim(),
            initialBalance: balance,
            isDemo: true,
        });
        navigate("/dashboard");
    };
    return (
        <AuthLayout>
            <section className="rounded-[2rem] border border-white/10 bg-[#0B1220]/80 p-6 text-center shadow-[0_0_80px_rgba(34,211,238,.1)] backdrop-blur-xl sm:p-8">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                    <Sparkles size={26} />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">
                    Demo AsetKita · {step}/2
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                    {step === 1 ? "Coba kelola aset Anda" : "Pilih saldo awal"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                    {step === 1
                        ? "Coba aktivitas demo dan belajar mengelola aset serta investasi saham dan kripto."
                        : "Saldo ini hanya untuk simulasi dan tidak menggunakan uang sungguhan."}
                </p>
                {error && (
                    <p
                        role="alert"
                        className="mt-5 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-left text-sm text-rose-200"
                    >
                        {error}
                    </p>
                )}
                {step === 1 ? (
                    <form onSubmit={next} className="mt-7 text-left">
                        <AuthField
                            label="Nama Panggilan"
                            value={nickname}
                            onChange={(event) => setNickname(event.target.value)}
                            placeholder="Contoh: InvestorPro"
                            icon={<UserRound size={17} />}
                            required
                        />
                        <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                            Lanjut <ArrowRight size={17} />
                        </button>
                    </form>
                ) : (
                    <div className="mt-7">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {balances.map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setBalance(value)}
                                    className={`rounded-2xl border p-4 text-left transition ${balance === value ? "border-cyan-300 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-[#060B16]/75 text-slate-300 hover:border-cyan-400/40"}`}
                                >
                                    <span className="text-sm text-slate-400">Saldo awal</span>
                                    <strong className="mt-1 block text-lg">
                                        {format(value)}
                                    </strong>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={start}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Masuk Dashboard Demo <ArrowRight size={17} />
                        </button>
                        <button
                            onClick={() => setStep(1)}
                            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300"
                        >
                            <ArrowLeft size={16} /> Kembali
                        </button>
                    </div>
                )}
                <div className="mt-7 space-y-2 text-left text-xs text-slate-400">
                    <p>
                        <CheckCircle2
                            className="mr-2 inline-block text-emerald-300"
                            size={14}
                        />
                        Data demo hanya tersimpan selama sesi browser
                    </p>
                    <p>
                        <CheckCircle2
                            className="mr-2 inline-block text-emerald-300"
                            size={14}
                        />
                        Tidak ada uang atau transaksi nyata
                    </p>
                </div>
                <p className="mt-7 text-sm text-slate-400">
                    Ingin mulai dengan akun asli?{" "}
                    <Link
                        to="/register"
                        className="font-medium text-cyan-300 hover:text-cyan-200"
                    >
                        Buat akun
                    </Link>
                </p>
            </section>
        </AuthLayout>
    );
}
