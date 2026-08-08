import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Mail,
    Phone,
    UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField, PasswordField } from "@/components/auth/AuthField";
import OtpInput from "@/components/auth/OtpInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { getAuthErrorMessage, signInDemo } from "@/services/authService";
import {
    completeRegistrationFlow,
    requestEmailOtp,
} from "@/services/otpService";
import {
    isIndonesianPhone,
    isStrongPassword,
    normalizePhone,
} from "@/utils/authValidation";
import type { RegisterPayload } from "@/types/auth";

const initialForm: RegisterPayload = {
    namaLengkap: "",
    namaPanggilan: "",
    email: "",
    nomorHP: "",
    password: "",
};
const steps = ["Informasi Akun", "Keamanan", "Verifikasi Email"];

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [confirm, setConfirm] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);

    const update = (key: keyof RegisterPayload, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));

    const nextAccount = () => {
        setError("");
        if (
            form.namaLengkap.trim().length < 2 ||
            form.namaPanggilan.trim().length < 2
        )
            return setError("Nama lengkap dan nama panggilan wajib diisi.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            return setError("Masukkan email aktif yang valid.");
        if (!isIndonesianPhone(form.nomorHP))
            return setError(
                "Gunakan nomor HP Indonesia yang valid, contoh +628123456789.",
            );
        update("nomorHP", normalizePhone(form.nomorHP));
        setStep(2);
    };

    const nextSecurity = async () => {
        setError("");
        if (!isStrongPassword(form.password))
            return setError("Kata sandi belum memenuhi seluruh persyaratan.");
        if (form.password !== confirm)
            return setError("Konfirmasi kata sandi belum sama.");
        setLoading(true);
        try {
            await requestEmailOtp(form.email, "register");
            sessionStorage.setItem("asetkita-register-otp", "");
            setStep(3);
            setNotice("Kode enam digit telah dikirim ke email aktif Anda.");
        } catch {
            const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
            sessionStorage.setItem("asetkita-register-otp", fallbackCode);
            setOtp(fallbackCode);
            setStep(3);
            setNotice(`Kode verifikasi sementara telah dibuat: ${fallbackCode}`);
        } finally {
            setLoading(false);
        }
    };

    const finish = async () => {
        setError("");
        const expectedOtp = sessionStorage.getItem("asetkita-register-otp") ?? "";
        if (otp.length !== 6) return setError("Masukkan 6 digit kode verifikasi.");
        if (expectedOtp && otp !== expectedOtp)
            return setError(
                "Kode verifikasi tidak sesuai. Silakan cek kembali input Anda.",
            );
        setLoading(true);
        try {
            const payload = {
                ...form,
                namaLengkap: form.namaLengkap.trim(),
                namaPanggilan: form.namaPanggilan.trim(),
                email: form.email.trim(),
                nomorHP: normalizePhone(form.nomorHP),
            };
            const result = await completeRegistrationFlow(payload, otp);
            if (result?.customToken) {
                await signInDemo(result.customToken);
            }
            navigate("/dashboard");
        } catch (reason) {
            setError(getAuthErrorMessage(reason));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <section className="w-full max-w-[520px] rounded-[2rem] border border-white/10 bg-[#0B1220]/75 p-6 shadow-[0_0_80px_rgba(15,23,42,.3)] backdrop-blur-xl sm:p-8">
                <div className="flex items-center justify-between gap-2">
                    {steps.map((label, index) => (
                        <div
                            key={label}
                            className="flex flex-1 items-center gap-2 last:flex-none"
                        >
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step > index + 1 ? "bg-emerald-400 text-slate-950" : step === index + 1 ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-400"}`}
                            >
                                {step > index + 1 ? <Check size={15} /> : index + 1}
                            </span>
                            {index < 2 && (
                                <span
                                    className={`h-px flex-1 ${step > index + 1 ? "bg-cyan-400" : "bg-white/10"}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-[.2em] text-cyan-300">
                    Tahap {step} dari 3 · {steps[step - 1]}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                    {step === 1
                        ? "Buat akun Anda"
                        : step === 2
                            ? "Amankan akun Anda"
                            : "Verifikasi email Anda"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step === 1
                        ? "Mulai perjalanan investasi Anda dengan data yang tepat."
                        : step === 2
                            ? "Buat password yang kuat untuk melindungi akses akun."
                            : `Masukkan kode yang dikirim ke ${form.email}.`}
                </p>
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
                {step === 1 && (
                    <div className="mt-7 space-y-4">
                        <AuthField
                            label="Nama Lengkap"
                            value={form.namaLengkap}
                            onChange={(event) => update("namaLengkap", event.target.value)}
                            placeholder="Nama lengkap Anda"
                            icon={<UserRound size={17} />}
                        />
                        <AuthField
                            label="Nama Panggilan"
                            value={form.namaPanggilan}
                            onChange={(event) => update("namaPanggilan", event.target.value)}
                            placeholder="Contoh: InvestorPro"
                            icon={<UserRound size={17} />}
                        />
                        <AuthField
                            label="Email Aktif"
                            type="email"
                            value={form.email}
                            onChange={(event) => update("email", event.target.value)}
                            placeholder="nama@email.com"
                            icon={<Mail size={17} />}
                        />
                        <AuthField
                            label="Nomor HP"
                            type="tel"
                            value={form.nomorHP}
                            onChange={(event) => update("nomorHP", event.target.value)}
                            placeholder="+628123456789"
                            icon={<Phone size={17} />}
                        />
                        <button
                            type="button"
                            onClick={nextAccount}
                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Lanjut <ArrowRight size={17} />
                        </button>
                    </div>
                )}
                {step === 2 && (
                    <div className="mt-7 space-y-5">
                        <PasswordField
                            label="Password"
                            value={form.password}
                            onChange={(event) => update("password", event.target.value)}
                            placeholder="Minimal 8 karakter"
                        />
                        <PasswordField
                            label="Konfirmasi Password"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            placeholder="Ulangi password Anda"
                        />
                        <PasswordRequirements password={form.password} />
                        <button
                            type="button"
                            disabled={loading}
                            onClick={nextSecurity}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                        >
                            {loading ? (
                                "Mengirim kode..."
                            ) : (
                                <>
                                    Lanjut <ArrowRight size={17} />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-cyan-300"
                        >
                            <ArrowLeft size={16} /> Kembali
                        </button>
                    </div>
                )}
                {step === 3 && (
                    <div className="mt-8 space-y-6">
                        <OtpInput value={otp} onChange={setOtp} />
                        <button
                            type="button"
                            disabled={loading}
                            onClick={finish}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                        >
                            {loading ? (
                                "Membuat akun..."
                            ) : (
                                <>
                                    <Check size={17} /> Buat Akun
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => void nextSecurity()}
                            className="w-full text-sm text-cyan-300 hover:text-cyan-200"
                        >
                            Kirim ulang kode
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="inline-flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-cyan-300"
                        >
                            <ArrowLeft size={16} /> Kembali
                        </button>
                    </div>
                )}
                <p className="mt-7 text-center text-sm text-slate-400">
                    Sudah memiliki akun?{" "}
                    <Link
                        to="/login"
                        className="font-medium text-cyan-300 hover:text-cyan-200"
                    >
                        Masuk
                    </Link>
                </p>
            </section>
        </AuthLayout>
    );
}
