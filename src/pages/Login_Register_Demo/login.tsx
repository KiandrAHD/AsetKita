import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField, PasswordField } from "@/components/auth/AuthField";
import OtpInput from "@/components/auth/OtpInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { getAuthErrorMessage, signIn } from "@/services/authService";
import {
    completePasswordReset,
    requestEmailOtp,
    verifyPasswordResetOtp,
} from "@/services/otpService";
import { recordLastLogin } from "@/services/userService";
import { isStrongPassword } from "@/utils/authValidation";

type ResetStep = "login" | "email" | "otp" | "password" | "success";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [resetStep, setResetStep] = useState<ResetStep>("login");
    const [otp, setOtp] = useState("");
    const [ticket, setTicket] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);
    const clearState = () => {
        setError("");
        setNotice("");
    };
    const login = async (event: React.FormEvent) => {
        event.preventDefault();
        clearState();
        setLoading(true);
        try {
            const result = await signIn(email, password, remember);
            void recordLastLogin(result.user.uid);
            navigate("/dashboard");
        } catch (reason) {
            setError(getAuthErrorMessage(reason));
        } finally {
            setLoading(false);
        }
    };
    const requestReset = async (event: React.FormEvent) => {
        event.preventDefault();
        clearState();
        setLoading(true);
        try {
            await requestEmailOtp(email, "reset-password");
            setResetStep("otp");
            setNotice(
                "Jika email terdaftar, kode verifikasi telah dikirim. Periksa kotak masuk Anda.",
            );
        } catch (reason) {
            setError(getAuthErrorMessage(reason));
        } finally {
            setLoading(false);
        }
    };
    const verifyOtp = async (event: React.FormEvent) => {
        event.preventDefault();
        clearState();
        if (otp.length !== 6) return setError("Masukkan 6 digit kode verifikasi.");
        setLoading(true);
        try {
            const result = await verifyPasswordResetOtp(email, otp);
            setTicket(result.resetTicket);
            setResetStep("password");
        } catch (reason) {
            setError(getAuthErrorMessage(reason));
        } finally {
            setLoading(false);
        }
    };
    const savePassword = async (event: React.FormEvent) => {
        event.preventDefault();
        clearState();
        if (!isStrongPassword(newPassword))
            return setError("Gunakan kata sandi yang memenuhi seluruh persyaratan.");
        if (newPassword !== confirmPassword)
            return setError("Konfirmasi kata sandi belum sama.");
        setLoading(true);
        try {
            await completePasswordReset(email, ticket, newPassword);
            setResetStep("success");
        } catch (reason) {
            setError(getAuthErrorMessage(reason));
        } finally {
            setLoading(false);
        }
    };
    const aside = (
        <div className="mx-auto max-w-md">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                <ShieldCheck size={16} /> Akses aman AsetKita
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-white">
                Kembali kelola aset Anda{" "}
                <span className="text-cyan-400">dengan percaya diri.</span>
            </h1>
            <p className="mt-6 leading-8 text-slate-300">
                Dashboard modern, insight real-time, dan perlindungan berlapis dalam
                satu pengalaman investasi.
            </p>
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-[#111827]/80 p-6 shadow-[0_0_70px_rgba(34,211,238,.1)]">
                <p className="text-sm text-slate-400">Ringkasan portofolio</p>
                <p className="mt-2 text-3xl font-semibold text-white">Rp 284 juta</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#060B16] p-4">
                        <p className="text-xs text-slate-400">Performa bulan ini</p>
                        <p className="mt-2 font-semibold text-emerald-300">+12,4%</p>
                    </div>
                    <div className="rounded-2xl bg-[#060B16] p-4">
                        <p className="text-xs text-slate-400">Insight AI</p>
                        <p className="mt-2 font-semibold text-cyan-200">8 terbaru</p>
                    </div>
                </div>
            </div>
        </div>
    );
    const title =
        resetStep === "login"
            ? "Selamat Datang Kembali"
            : resetStep === "email"
                ? "Pulihkan akses akun"
                : resetStep === "otp"
                    ? "Masukkan kode verifikasi"
                    : resetStep === "password"
                        ? "Buat kata sandi baru"
                        : "Password berhasil diperbarui";
    const description =
        resetStep === "login"
            ? "Masuk untuk mengakses dashboard investasi Anda."
            : resetStep === "email"
                ? "Masukkan email Anda. Kami akan mengirim kode verifikasi bila akun tersedia."
                : resetStep === "otp"
                    ? `Masukkan kode enam digit yang dikirim ke ${email}.`
                    : resetStep === "password"
                        ? "Buat kata sandi baru yang kuat untuk menjaga akun Anda."
                        : "Silakan masuk dengan kata sandi baru Anda.";
    return (
        <AuthLayout aside={aside}>
            <section className="rounded-[2rem] border border-white/10 bg-[#0B1220]/70 p-6 shadow-[0_0_80px_rgba(15,23,42,.3)] backdrop-blur-xl sm:p-8">
                <h2 className="text-3xl font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                {error && (
                    <p
                        role="alert"
                        className="mt-5 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
                    >
                        {error}
                    </p>
                )}
                {notice && (
                    <p
                        role="status"
                        className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"
                    >
                        {notice}
                    </p>
                )}
                {resetStep === "login" && (
                    <form onSubmit={login} className="mt-7 space-y-5">
                        <AuthField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="nama@email.com"
                            icon={<Mail size={17} />}
                            required
                        />
                        <PasswordField
                            label="Kata Sandi"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Masukkan kata sandi"
                            required
                        />
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <label className="flex items-center gap-2 text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                    className="h-4 w-4 rounded border-white/20 accent-cyan-400"
                                />
                                Ingat saya
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    clearState();
                                    setResetStep("email");
                                }}
                                className="font-medium text-cyan-300 hover:text-cyan-200"
                            >
                                Lupa Password?
                            </button>
                        </div>
                        <button
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                        >
                            {loading ? (
                                "Memproses..."
                            ) : (
                                <>
                                    Masuk <ArrowRight size={17} />
                                </>
                            )}
                        </button>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="h-px flex-1 bg-white/10" />
                            atau
                            <span className="h-px flex-1 bg-white/10" />
                        </div>
                        <Link
                            to="/demo"
                            className="block rounded-full border border-white/15 px-6 py-3.5 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
                        >
                            Coba Akun Demo
                        </Link>
                        <p className="text-center text-sm text-slate-400">
                            Belum memiliki akun?{" "}
                            <Link
                                to="/register"
                                className="font-medium text-cyan-300 hover:text-cyan-200"
                            >
                                Daftar Sekarang
                            </Link>
                        </p>
                    </form>
                )}
                {resetStep === "email" && (
                    <form onSubmit={requestReset} className="mt-7 space-y-5">
                        <AuthField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="nama@email.com"
                            icon={<Mail size={17} />}
                            required
                        />
                        <button
                            disabled={loading}
                            className="w-full rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                        >
                            {loading ? "Mengirim kode..." : "Kirim Kode"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                clearState();
                                setResetStep("login");
                            }}
                            className="w-full text-sm text-slate-400 hover:text-cyan-300"
                        >
                            Kembali ke Login
                        </button>
                    </form>
                )}
                {resetStep === "otp" && (
                    <form onSubmit={verifyOtp} className="mt-7 space-y-6">
                        <OtpInput value={otp} onChange={setOtp} />
                        <button
                            disabled={loading}
                            className="w-full rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                        >
                            {loading ? "Memverifikasi..." : "Lanjutkan"}
                        </button>
                        <button
                            type="button"
                            onClick={requestReset as unknown as () => void}
                            className="w-full text-sm text-cyan-300 hover:text-cyan-200"
                        >
                            Kirim ulang kode
                        </button>
                    </form>
                )}
                {resetStep === "password" && (
                    <form onSubmit={savePassword} className="mt-7 space-y-5">
                        <PasswordField
                            label="Password Baru"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="Minimal 8 karakter"
                            required
                        />
                        <PasswordField
                            label="Konfirmasi Password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Ulangi password baru"
                            required
                        />
                        <PasswordRequirements password={newPassword} />
                        <button
                            disabled={loading}
                            className="w-full rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                        >
                            {loading ? "Menyimpan..." : "Simpan Password Baru"}
                        </button>
                    </form>
                )}
                {resetStep === "success" && (
                    <div className="mt-8 text-center">
                        <CheckCircle2 className="mx-auto text-emerald-300" size={42} />
                        <button
                            type="button"
                            onClick={() => {
                                clearState();
                                setPassword("");
                                setResetStep("login");
                            }}
                            className="mt-6 w-full rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950"
                        >
                            Kembali ke Login
                        </button>
                    </div>
                )}
            </section>
        </AuthLayout>
    );
}
