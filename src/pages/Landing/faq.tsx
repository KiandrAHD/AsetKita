import { useMemo, useState } from "react";
import {
    ArrowRight,
    ChevronDown,
    CircleHelp,
    Search,
    Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import MarketingShell from "@/components/marketing/MarketingShell";

const categories = [
    "Semua",
    "Akun",
    "Keamanan",
    "Investasi",
    "AI",
    "Pembayaran",
    "Dashboard",
    "Market",
    "Portofolio",
];
const faqItems = [
    {
        category: "Akun",
        question: "Bagaimana cara membuat akun AsetKita?",
        answer:
            "Pilih Mulai Sekarang, isi data dasar Anda, lalu ikuti proses verifikasi email untuk mengaktifkan akun.",
    },
    {
        category: "Akun",
        question: "Bagaimana jika saya lupa kata sandi?",
        answer:
            "Gunakan tautan pemulihan pada halaman masuk. Kami akan mengirim instruksi aman ke email terverifikasi Anda.",
    },
    {
        category: "Keamanan",
        question: "Apakah akun saya memiliki perlindungan tambahan?",
        answer:
            "AsetKita mendukung verifikasi email dan lapisan keamanan akun agar akses penting dapat dikonfirmasi dengan baik.",
    },
    {
        category: "Investasi",
        question: "Apakah AsetKita cocok untuk investor pemula?",
        answer:
            "Ya. Dashboard dan insight dirancang untuk membantu Anda memahami kondisi aset dengan lebih jelas, sesuai ritme belajar Anda.",
    },
    {
        category: "AI",
        question: "Bagaimana AI AsetKita memberikan insight?",
        answer:
            "AI merangkum sinyal pasar dan data portofolio untuk membantu Anda melihat informasi yang relevan sebelum mengambil keputusan.",
    },
    {
        category: "Pembayaran",
        question: "Di mana saya melihat riwayat transaksi?",
        answer:
            "Riwayat transaksi dan aktivitas terkait dapat dipantau melalui area dashboard akun Anda.",
    },
    {
        category: "Dashboard",
        question: "Apa yang bisa saya lihat di dashboard?",
        answer:
            "Dashboard menyajikan nilai aset, perubahan performa, komposisi portofolio, serta insight yang dapat ditindaklanjuti.",
    },
    {
        category: "Market",
        question: "Seberapa sering data market diperbarui?",
        answer:
            "AsetKita menampilkan pembaruan sesuai ketersediaan sumber data dan memberi konteks agar pergerakan pasar lebih mudah dipahami.",
    },
    {
        category: "Portofolio",
        question: "Bagaimana cara membaca kesehatan portofolio?",
        answer:
            "Gunakan ringkasan alokasi, performa, dan indikator risiko untuk memahami keseimbangan portofolio Anda secara menyeluruh.",
    },
];

export default function Faq() {
    const [category, setCategory] = useState("Semua");
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState<number | null>(0);
    const results = useMemo(
        () =>
            faqItems.filter(
                (item) =>
                    (category === "Semua" || item.category === category) &&
                    `${item.question} ${item.answer}`
                        .toLocaleLowerCase("id")
                        .includes(query.toLocaleLowerCase("id")),
            ),
        [category, query],
    );
    return (
        <MarketingShell>
            <section className="mx-auto max-w-5xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8 lg:pb-16">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
                    <CircleHelp size={16} /> Pusat Bantuan AsetKita
                </span>
                <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Jawaban yang Anda butuhkan,{" "}
                    <span className="text-cyan-400">saat Anda membutuhkannya.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl leading-8 text-slate-300">
                    Temukan panduan singkat untuk mengelola akun, memahami investasi, dan
                    menggunakan AsetKita dengan percaya diri.
                </p>
                <label className="relative mx-auto mt-10 block max-w-3xl text-left">
                    <Search
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-300"
                        size={20}
                    />
                    <input
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setOpen(null);
                        }}
                        placeholder="Cari pertanyaan atau kata kunci..."
                        className="w-full rounded-2xl border border-white/10 bg-[#111827]/80 py-5 pl-14 pr-5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                    />
                </label>
            </section>
            <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => {
                                setCategory(item);
                                setOpen(null);
                            }}
                            className={`rounded-full border px-4 py-2 text-sm transition ${item === category ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/30 hover:text-cyan-200"}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <div className="mt-10 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-200">
                            {category === "Semua" ? "Semua pertanyaan" : category}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            {results.length} jawaban ditemukan
                        </p>
                    </div>
                </div>
                <div className="mt-5 space-y-3">
                    {results.map((item, index) => {
                        const isOpen = open === index;
                        return (
                            <article
                                key={item.question}
                                className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0B1220]/80 transition hover:border-cyan-400/25"
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpen(isOpen ? null : index)}
                                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                                >
                                    <span>
                                        <span className="mb-2 block text-xs font-medium uppercase tracking-[.16em] text-cyan-300">
                                            {item.category}
                                        </span>
                                        <span className="font-medium text-white">
                                            {item.question}
                                        </span>
                                    </span>
                                    <ChevronDown
                                        className={`shrink-0 text-cyan-300 transition duration-300 ${isOpen ? "rotate-180" : ""}`}
                                        size={20}
                                    />
                                </button>
                                <div
                                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                                >
                                    <p className="overflow-hidden px-5 pb-5 text-sm leading-7 text-slate-400 sm:px-6 sm:pb-6">
                                        {item.answer}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                    {results.length === 0 && (
                        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
                            <p className="font-medium text-white">
                                Belum ada jawaban yang cocok.
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Coba gunakan kata kunci lain atau hubungi tim AsetKita.
                            </p>
                            <Link
                                to="/contact"
                                className="mt-6 inline-flex rounded-full border border-cyan-400/30 px-5 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/10"
                            >
                                Hubungi Dukungan
                            </Link>
                        </div>
                    )}
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="grid gap-6 rounded-[2.25rem] border border-white/10 bg-[#111827]/75 p-7 shadow-[0_0_70px_rgba(15,23,42,.22)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[.25em] text-cyan-300">
                            Butuh bantuan lain?
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                            Tim AsetKita siap membantu Anda.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                            Kirimkan pertanyaan lebih spesifik dan kami akan menghubungi Anda
                            maksimal dalam 24 jam.
                        </p>
                    </div>
                    <Link
                        to="/contact"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                        Kirim Pesan <Send size={16} />
                    </Link>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/15 via-[#111827] to-blue-500/15 px-6 py-12 text-center sm:px-10">
                    <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                        Siap mengelola aset dengan lebih jelas?
                    </h2>
                    <p className="mt-4 text-slate-300">
                        Mulai perjalanan investasi Anda bersama dashboard dan insight
                        AsetKita.
                    </p>
                    <Link
                        to="/register"
                        className="mt-7 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                        Mulai Sekarang <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </MarketingShell>
    );
}
