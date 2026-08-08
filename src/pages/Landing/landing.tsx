import {
    ArrowRight,
    Bot,
    Check,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import MarketingShell from "@/components/marketing/MarketingShell";

const features = [
    {
        title: "Asisten Investasi AI",
        text: "Insight yang relevan untuk membantu Anda membaca peluang dan risiko.",
        icon: Bot,
    },
    {
        title: "Analisis Real-time",
        text: "Pantau perubahan aset dan pasar dari satu dashboard yang tenang.",
        icon: TrendingUp,
    },
    {
        title: "Keamanan Berlapis",
        text: "Perlindungan data dan privasi dirancang sejak awal pengalaman Anda.",
        icon: ShieldCheck,
    },
];

export default function Landing() {
    return (
        <MarketingShell>
            <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
                <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
                        <Sparkles size={16} /> Platform investasi berbasis AI
                    </p>
                    <h1 className="mt-6 text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-7xl">
                        Kelola aset Anda{" "}
                        <span className="block text-cyan-400">
                            lebih cerdas bersama AI.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                        Satu platform modern untuk memantau aset, memahami pasar, dan
                        mengambil keputusan investasi dengan lebih yakin.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Mulai Sekarang <ArrowRight size={16} />
                        </Link>
                        <Link
                            to="/security"
                            className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-300"
                        >
                            Pelajari Keamanan
                        </Link>
                    </div>
                </div>
                <div className="relative rounded-[2rem] border border-cyan-400/20 bg-[#111827]/85 p-5 shadow-[0_0_90px_rgba(34,211,238,.14)] backdrop-blur-xl sm:p-7">
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#0B1220] p-5">
                        <p className="text-sm text-slate-400">Nilai portofolio</p>
                        <div className="mt-2 flex items-end justify-between gap-4">
                            <p className="text-3xl font-semibold text-white">Rp 284 juta</p>
                            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300">
                                +8,52%
                            </span>
                        </div>
                        <div className="mt-6 h-32 rounded-xl bg-[linear-gradient(145deg,transparent_30%,rgba(34,211,238,.16))] [clip-path:polygon(0_80%,15%_58%,27%_70%,43%_25%,58%_50%,72%_18%,86%_36%,100%_5%,100%_100%,0_100%)]" />
                    </div>
                    <div className="mt-4 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-5">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                                <Bot size={18} />
                            </span>
                            <div>
                                <p className="font-semibold text-white">AsetKita AI</p>
                                <p className="text-sm text-slate-400">
                                    Portofolio Anda berada dalam kisaran sehat.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="grid gap-6 md:grid-cols-3">
                    {features.map(({ title, text, icon: Icon }) => (
                        <article
                            key={title}
                            className="rounded-[1.75rem] border border-white/10 bg-[#111827]/75 p-7 transition hover:-translate-y-1 hover:border-cyan-400/40"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                                <Icon size={21} />
                            </span>
                            <h2 className="mt-6 text-xl font-semibold text-white">{title}</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/15 via-[#111827] to-teal-500/15 px-6 py-12 sm:px-10">
                    <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                        Satu langkah berikutnya
                    </p>
                    <h2 className="mt-4 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
                        Pahami aset Anda, lalu tumbuh dengan strategi yang lebih terarah.
                    </h2>
                    <ul className="mt-6 space-y-3 text-sm text-slate-300">
                        {[
                            "Skor kesehatan portofolio",
                            "Peringatan risiko real-time",
                            "Insight pasar yang personal",
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3">
                                <Check className="text-emerald-300" size={17} />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <Link
                        to="/faq"
                        className="mt-8 inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40"
                    >
                        Lihat FAQ
                    </Link>
                </div>
            </section>
        </MarketingShell>
    );
}
