import { useEffect, useState } from "react";
import {
    Bot,
    Check,
    ChevronRight,
    Globe2,
    Layers3,
    Menu,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    X,
} from "lucide-react";

const storyStats = [
    { value: "2026", label: "Tahun Pengembangan" },
    { value: "10+", label: "Fitur Utama" },
    { value: "100%", label: "Fokus Indonesia" },
    { value: "24/7", label: "AI Siap Membantu" },
];

const values = [
    {
        title: "Inovasi",
        description: "Kami terus menghadirkan teknologi terbaru untuk mempermudah pengelolaan aset.",
        icon: Sparkles,
    },
    {
        title: "Keamanan",
        description: "Privasi dan keamanan pengguna adalah prioritas utama.",
        icon: ShieldCheck,
    },
    {
        title: "Transparansi",
        description: "Semua informasi disajikan secara jelas dan mudah dipahami.",
        icon: TrendingUp,
    },
    {
        title: "Kolaborasi",
        description: "Kami percaya solusi terbaik dibangun bersama pengguna.",
        icon: Layers3,
    },
];

const roadmap = [
    { year: "2026", title: "Peluncuran Landing Page" },
    { year: "2026 Q2", title: "Dashboard Portofolio" },
    { year: "2026 Q3", title: "AI Advisor" },
    { year: "2026 Q4", title: "Aplikasi Mobile" },
    { year: "2027", title: "Integrasi Bank & Investasi" },
];

const team = [
    {
        role: "UI/UX Designer",
        description: "Merancang pengalaman pengguna yang modern dan intuitif.",
    },
    {
        role: "Frontend Developer",
        description: "Mengembangkan antarmuka yang cepat, responsif, dan konsisten.",
    },
    {
        role: "AI & Backend Developer",
        description: "Membangun sistem AI dan layanan backend yang aman serta andal.",
    },
];

function About() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 16);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#050816] text-slate-100">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
                <div className="absolute right-[-8%] top-[18%] h-80 w-80 rounded-full bg-emerald-500/20 blur-[140px]" />
                <div className="absolute bottom-0 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[180px]" />
            </div>

            <header
                className={`fixed inset-x-0 top-0 z-[70] border-b transition-all duration-300 ease-in-out ${
                    scrolled
                        ? "border-cyan-400/20 bg-[#030712]/80 shadow-[0_10px_35px_rgba(2,6,23,0.35)] backdrop-blur-2xl"
                        : "border-white/10 bg-[rgba(5,8,22,0.55)] backdrop-blur-xl"
                }`}
            >
                <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <a href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                            A
                        </span>
                        <span>
                            Aset<span className="text-cyan-400">Kita</span>
                        </span>
                    </a>

                    <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
                        {[
                            ["Home", "/"],
                            ["About Us", "/about"],
                            ["Security", "/security"],
                            ["FAQ", "/#faq"],
                            ["Contact", "/contact"],
                        ].map(([label, href]) => (
                            <a key={label} href={href} className="transition hover:text-cyan-300">
                                {label}
                            </a>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        <a
                            href="/contact"
                            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
                        >
                            Masuk
                        </a>
                        <a
                            href="/about"
                            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Mulai Sekarang
                        </a>
                    </div>

                    <button
                        type="button"
                        className="rounded-full border border-white/15 p-2 text-slate-200 md:hidden"
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </nav>

                {menuOpen ? (
                    <div className="border-t border-white/10 bg-[#030712]/95 px-4 py-4 backdrop-blur-xl md:hidden">
                        <div className="flex flex-col gap-3 text-sm text-slate-300">
                            {[
                                ["Home", "/"],
                                ["About Us", "/about"],
                                ["Security", "/security"],
                                ["FAQ", "/#faq"],
                                ["Contact", "/contact"],
                            ].map(([label, href]) => (
                                <a
                                    key={label}
                                    href={href}
                                    className="rounded-2xl border border-white/10 px-4 py-3 transition hover:border-cyan-400/40 hover:text-cyan-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                    </div>
                ) : null}
            </header>

            <main className="pt-24 sm:pt-28 lg:pt-32">
                <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-slate-900/80 to-emerald-500/20 px-6 py-12 shadow-[0_0_100px_rgba(34,211,238,0.12)] sm:px-10 lg:px-14">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%)]" />
                        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
                                    <Sparkles size={16} />
                                    Tentang AsetKita
                                </div>
                                <h1 className="mt-6 text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                                    Membangun Masa Depan
                                    <span className="mt-2 block text-cyan-400">Manajemen Aset Digital Indonesia</span>
                                </h1>
                                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                                    AsetKita hadir untuk membantu masyarakat Indonesia mengelola, memantau, dan mengembangkan aset mereka melalui teknologi, analisis data, dan kecerdasan buatan dalam satu platform modern.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <a href="/about" className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                                        Jelajahi Platform
                                    </a>
                                    <a href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-300">
                                        Hubungi Kami
                                    </a>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-[0_0_80px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-7">
                                <div className="rounded-[1.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                                            <Bot size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-white">Visi Platform</p>
                                            <p className="text-sm text-slate-400">Satu ekosistem untuk aset Anda</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        {["Analisis real-time", "Keamanan tingkat tinggi"].map((item) => (
                                            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                                                {item}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-slate-900/70 p-4">
                                        <div className="flex items-center gap-2 text-sm text-cyan-300">
                                            <Check size={16} />
                                            Menyederhanakan keputusan finansial yang lebih cerdas
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-400">
                                            Dengan AI dan data terintegrasi, pengguna mendapatkan satu pandangan yang penuh konteks untuk mengelola aset mereka.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
                        <div className="flex flex-col justify-center">
                            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Cerita AsetKita</p>
                            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Perjalanan Kami</h2>
                            <p className="mt-5 text-base leading-8 text-slate-300">
                                AsetKita lahir dari kebutuhan sederhana: banyak orang memiliki berbagai jenis aset, tetapi kesulitan mengelolanya dalam satu tempat.
                            </p>
                            <p className="mt-4 text-base leading-8 text-slate-300">
                                Mulai dari tabungan, emas, saham, reksa dana, hingga aset digital, semuanya sering tersebar di berbagai aplikasi. Kami ingin menghadirkan satu platform terpadu yang mampu memberikan gambaran menyeluruh mengenai kondisi keuangan pengguna.
                            </p>
                            <p className="mt-4 text-base leading-8 text-slate-300">
                                Dengan dukungan Artificial Intelligence, analisis data, serta keamanan tingkat tinggi, AsetKita membantu pengguna mengambil keputusan finansial yang lebih cerdas.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {storyStats.map((stat) => (
                                <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40">
                                    <p className="text-3xl font-semibold text-white sm:text-4xl">{stat.value}</p>
                                    <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-8 shadow-[0_0_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40">
                            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Visi</p>
                            <h3 className="mt-4 text-2xl font-semibold text-white">Menjadi platform pengelolaan aset digital terpercaya di Indonesia.</h3>
                            <p className="mt-5 text-base leading-8 text-slate-300">
                                Menjadi platform pengelolaan aset digital terpercaya di Indonesia yang membantu setiap orang memahami, mengembangkan, dan melindungi aset mereka melalui teknologi modern.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-8 shadow-[0_0_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40">
                            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Misi</p>
                            <ul className="mt-5 space-y-3 text-base leading-7 text-slate-300">
                                {[
                                    "Menyediakan dashboard aset yang mudah digunakan.",
                                    "Mengembangkan AI sebagai asisten keuangan pribadi.",
                                    "Menyediakan analisis aset secara real-time.",
                                    "Menjaga keamanan data pengguna dengan standar tinggi.",
                                    "Meningkatkan literasi keuangan digital masyarakat Indonesia.",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                                            <Check size={14} />
                                        </span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {values.map((value) => {
                            const Icon = value.icon;
                            return (
                                <article
                                    key={value.title}
                                    className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-7 shadow-[0_0_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-white">{value.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-400">{value.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Roadmap</p>
                        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Perjalanan yang Terarah</h2>
                    </div>

                    <div className="mx-auto mt-10 max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_80px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:p-10">
                        <div className="relative">
                            <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-cyan-400/60 via-cyan-400/20 to-transparent lg:left-1/2 lg:-translate-x-1/2" />
                            <div className="space-y-6">
                                {roadmap.map((item, index) => (
                                    <div key={item.year} className={`relative flex flex-col lg:flex-row ${index % 2 === 0 ? "lg:justify-start" : "lg:justify-end"}`}>
                                        <div className="flex items-start gap-4 lg:w-[calc(50%-1.5rem)]">
                                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                                                <ChevronRight size={16} />
                                            </div>
                                            <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 px-5 py-4">
                                                <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">{item.year}</p>
                                                <p className="mt-2 text-lg font-semibold text-white">{item.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Tim Pengembang</p>
                        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Tim di Balik AsetKita</h2>
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {team.map((person) => (
                            <div key={person.role} className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-7 shadow-[0_0_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                                    <Globe2 size={24} />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-white">{person.role}</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-400">{person.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-slate-900/80 to-emerald-500/20 px-6 py-12 shadow-[0_0_100px_rgba(34,211,238,0.12)] sm:px-10 lg:px-14">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%)]" />
                        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Mari Bangun Bersama</p>
                                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                                    Mari Bangun Masa Depan Investasi Bersama
                                </h2>
                                <p className="mt-4 text-base leading-8 text-slate-300">
                                    Kelola aset Anda lebih mudah dengan teknologi AI dan dashboard modern dari AsetKita.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <a href="/" className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                                    Mulai Sekarang
                                </a>
                                <a href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-300">
                                    Hubungi Kami
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/10 bg-[#030712]/90 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-sm">
                        <a href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                                A
                            </span>
                            <span>
                                Aset<span className="text-cyan-400">Kita</span>
                            </span>
                        </a>
                        <p className="mt-4 text-sm leading-7 text-slate-400">
                            Platform investasi modern yang fokus pada kejelasan, kecerdasan, dan pertumbuhan jangka panjang.
                        </p>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-3">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Perusahaan</h3>
                            <ul className="mt-4 space-y-3 text-sm text-slate-400">
                                <li><a className="transition hover:text-cyan-300" href="/about">Tentang</a></li>
                                <li><a className="transition hover:text-cyan-300" href="/contact">Kontak</a></li>
                                <li><a className="transition hover:text-cyan-300" href="/#faq">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Legal</h3>
                            <ul className="mt-4 space-y-3 text-sm text-slate-400">
                                <li><a className="transition hover:text-cyan-300" href="#">Kebijakan Privasi</a></li>
                                <li><a className="transition hover:text-cyan-300" href="#">Syarat & Ketentuan</a></li>
                                <li><a className="transition hover:text-cyan-300" href="#">Keamanan</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Sosial</h3>
                            <ul className="mt-4 space-y-3 text-sm text-slate-400">
                                <li><a className="transition hover:text-cyan-300" href="#">X / Twitter</a></li>
                                <li><a className="transition hover:text-cyan-300" href="#">LinkedIn</a></li>
                                <li><a className="transition hover:text-cyan-300" href="#">Instagram</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2026 AsetKita. Semua hak dilindungi.</p>
                    <p>Dibangun untuk investor modern yang mengutamakan kejelasan dan kecepatan.</p>
                </div>
            </footer>
        </div>
    );
}

export default About;