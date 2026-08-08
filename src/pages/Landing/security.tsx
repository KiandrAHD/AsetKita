import { useState } from "react";
import {
    Activity,
    ArrowRight,
    Check,
    ChevronDown,
    Eye,
    Fingerprint,
    KeyRound,
    LockKeyhole,
    ShieldCheck,
    ShieldEllipsis,
    Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import MarketingShell from "@/components/marketing/MarketingShell";

const protections = [
    {
        title: "Enkripsi Data",
        text: "Data dilindungi saat dikirim dan disimpan dengan enkripsi kuat agar hanya dapat diakses melalui jalur yang sah.",
        icon: LockKeyhole,
    },
    {
        title: "Autentikasi Dua Faktor",
        text: "Tambahkan verifikasi kedua untuk setiap akses penting ke akun dan perubahan sensitif.",
        icon: KeyRound,
    },
    {
        title: "Verifikasi Email",
        text: "Konfirmasi berlapis membantu memastikan aktivitas akun benar-benar berasal dari Anda.",
        icon: Check,
    },
    {
        title: "Deteksi Fraud AI",
        text: "Sinyal aktivitas dianalisis untuk mengenali pola yang tidak biasa secara lebih cepat.",
        icon: Sparkles,
    },
    {
        title: "Pemantauan Real-time",
        text: "Sistem mengawasi peristiwa penting sepanjang waktu dan memberi sinyal saat perlu ditinjau.",
        icon: Activity,
    },
    {
        title: "Zero Knowledge",
        text: "Privasi dirancang sebagai prinsip utama agar data sensitif tetap berada dalam kendali Anda.",
        icon: Eye,
    },
];
const timeline = [
    [
        "01",
        "Autentikasi",
        "Permintaan akses diverifikasi melalui kredensial dan lapisan keamanan akun.",
    ],
    [
        "02",
        "Enkripsi",
        "Data dilindungi sebelum berpindah melalui infrastruktur AsetKita.",
    ],
    [
        "03",
        "Pemrosesan terlindungi",
        "Layanan memproses informasi hanya untuk menghadirkan fungsi yang Anda gunakan.",
    ],
    [
        "04",
        "Pemantauan",
        "Sinyal risiko dan aktivitas tidak biasa dipantau secara berkelanjutan.",
    ],
    [
        "05",
        "Akses pengguna",
        "Informasi kembali disajikan secara aman melalui dashboard pribadi Anda.",
    ],
];
const standards = ["OJK", "ISO 27001", "SOC 2", "AES-256"];
const questions = [
    [
        "Bagaimana data saya disimpan?",
        "Data dirancang untuk tetap terlindungi melalui kontrol akses, enkripsi, dan pemantauan berkelanjutan.",
    ],
    [
        "Apa yang terjadi jika perangkat 2FA hilang?",
        "Gunakan proses pemulihan akun yang terverifikasi dan segera hubungi dukungan bila menemukan aktivitas yang tidak dikenal.",
    ],
    [
        "Apakah data saya dibagikan kepada pihak lain?",
        "AsetKita berkomitmen menggunakan data secara terbatas untuk menyediakan layanan dan menjaga pengalaman pengguna tetap aman.",
    ],
    [
        "Bagaimana AsetKita menangani risiko keamanan?",
        "Tim dan sistem pemantauan meninjau sinyal risiko, membatasi dampak, serta menindaklanjuti kejadian sesuai prosedur keamanan.",
    ],
];

export default function Security() {
    const [open, setOpen] = useState<number | null>(0);
    return (
        <MarketingShell>
            <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-24">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-[#111827]/90 to-teal-500/15 px-6 py-14 shadow-[0_0_100px_rgba(34,211,238,.12)] sm:px-10 lg:px-14 lg:py-20">
                    <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/15 blur-[100px]" />
                    <div className="relative grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
                                <ShieldCheck size={16} /> Keamanan AsetKita
                            </p>
                            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.06] text-white sm:text-5xl lg:text-6xl">
                                Kepercayaan Anda dijaga di{" "}
                                <span className="text-cyan-400">setiap lapisan.</span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                                Kami merancang pengalaman investasi yang mengutamakan
                                perlindungan data, privasi, dan ketenangan Anda sejak awal.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                                >
                                    Lindungi Aset Anda <ArrowRight size={16} />
                                </Link>
                                <a
                                    href="#faq-keamanan"
                                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-300"
                                >
                                    Lihat FAQ Keamanan
                                </a>
                            </div>
                        </div>
                        <div className="rounded-[2rem] border border-cyan-400/20 bg-[#0B1220]/80 p-5 shadow-[0_0_70px_rgba(34,211,238,.12)] backdrop-blur-xl">
                            <div className="rounded-[1.5rem] border border-white/10 bg-[#111827]/80 p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                                            <Fingerprint />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-white">
                                                Pusat Perlindungan
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                Status sistem terlindungi
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                        Aktif
                                    </span>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    {[
                                        ["Akses akun", "Terverifikasi"],
                                        ["Data sensitif", "Terenkripsi"],
                                        ["Pemantauan", "24/7"],
                                        ["Privasi", "Terkendali"],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                        >
                                            <p className="text-xs text-slate-400">{label}</p>
                                            <p className="mt-2 text-sm font-semibold text-cyan-200">
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                            Security overview
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                            Perlindungan yang bekerja tanpa mengganggu fokus Anda.
                        </h2>
                        <p className="mt-5 leading-8 text-slate-300">
                            Dari akses awal hingga insight di dashboard, perlindungan
                            dirancang menyatu dengan setiap interaksi.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {protections.map(({ title, text, icon: Icon }) => (
                            <article
                                key={title}
                                className="group rounded-[1.6rem] border border-white/10 bg-[#111827]/75 p-6 shadow-[0_0_50px_rgba(15,23,42,.25)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_70px_rgba(34,211,238,.13)]"
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                                    <Icon size={20} />
                                </span>
                                <h3 className="mt-5 font-semibold text-white">{title}</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-10">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                            Alur perlindungan
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                            Data diproses dengan penuh pertimbangan.
                        </h2>
                    </div>
                    <div className="mt-10 grid gap-4 md:grid-cols-5">
                        {timeline.map(([number, title, text]) => (
                            <div
                                key={number}
                                className="relative rounded-[1.5rem] border border-white/10 bg-[#0B1220]/80 p-5"
                            >
                                <span className="text-sm font-semibold text-cyan-300">
                                    {number}
                                </span>
                                <h3 className="mt-5 font-semibold text-white">{title}</h3>
                                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
                <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                    Standar keamanan
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                    Dirancang mengikuti praktik perlindungan modern.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                    Badge berikut menandai standar dan prinsip yang menjadi acuan
                    perlindungan AsetKita, bukan pernyataan sertifikasi atau registrasi
                    resmi.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {standards.map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border border-teal-400/20 bg-teal-400/5 px-5 py-6 text-sm font-semibold text-teal-200"
                        >
                            <ShieldEllipsis className="mx-auto mb-3" size={22} />
                            {item}
                        </div>
                    ))}
                </div>
            </section>
            <section
                id="faq-keamanan"
                className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
            >
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                        FAQ Keamanan
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                        Jawaban untuk rasa tenang Anda.
                    </h2>
                </div>
                <div className="mt-10 space-y-3">
                    {questions.map(([question, answer], index) => {
                        const isOpen = open === index;
                        return (
                            <article
                                key={question}
                                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]/75"
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpen(isOpen ? null : index)}
                                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-medium text-white sm:px-6"
                                >
                                    <span>{question}</span>
                                    <ChevronDown
                                        className={`shrink-0 text-cyan-300 transition ${isOpen ? "rotate-180" : ""}`}
                                        size={19}
                                    />
                                </button>
                                <div
                                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                                >
                                    <p className="overflow-hidden px-5 pb-5 text-sm leading-7 text-slate-400 sm:px-6 sm:pb-6">
                                        {answer}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/15 via-[#111827] to-teal-500/15 px-6 py-12 text-center sm:px-10">
                    <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                        Mulai membangun masa depan aset yang lebih tenang.
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                        Buat akun AsetKita dan kelola perjalanan investasi Anda dengan
                        percaya diri.
                    </p>
                    <Link
                        to="/register"
                        className="mt-7 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                        Mulai Sekarang
                    </Link>
                </div>
            </section>
        </MarketingShell>
    );
}
