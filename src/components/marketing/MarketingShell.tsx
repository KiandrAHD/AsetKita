import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

type MarketingShellProps = { children: ReactNode };

const navigation = [
    { label: "Beranda", to: "/" },
    { label: "Tentang", to: "/about" },
    { label: "Keamanan", to: "/security" },
    { label: "FAQ", to: "/faq" },
    { label: "Kontak", to: "/contact" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `transition hover:text-cyan-300 ${isActive ? "text-cyan-300" : "text-slate-300"}`;

export function MarketingHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-[70] border-b transition-all duration-300 ${scrolled ? "border-cyan-400/20 bg-[#060B16]/85 shadow-[0_10px_35px_rgba(2,6,23,.45)] backdrop-blur-2xl" : "border-white/10 bg-[#060B16]/60 backdrop-blur-xl"}`}
        >
            <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                        A
                    </span>
                    <span>
                        Aset<span className="text-cyan-400">Kita</span>
                    </span>
                </Link>
                <div className="hidden items-center gap-7 text-sm md:flex">
                    {navigation.map((item) => (
                        <NavLink key={item.to} to={item.to} className={linkClass}>
                            {item.label}
                        </NavLink>
                    ))}
                </div>
                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        to="/login"
                        className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
                    >
                        Masuk
                    </Link>
                    <Link
                        to="/register"
                        className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                        Mulai Sekarang
                    </Link>
                </div>
                <button
                    type="button"
                    aria-label="Buka navigasi"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                    className="rounded-full border border-white/15 p-2 text-slate-200 md:hidden"
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </nav>
            {menuOpen && (
                <div className="border-t border-white/10 bg-[#060B16]/95 px-4 py-4 backdrop-blur-xl md:hidden">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) =>
                                    `rounded-2xl border px-4 py-3 text-sm transition ${isActive ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-300 hover:border-cyan-400/40"}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}

export function MarketingFooter() {
    return (
        <footer className="border-t border-white/10 bg-[#060B16]/90 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:justify-between">
                <div className="max-w-sm">
                    <Link
                        to="/"
                        className="flex items-center gap-3 text-lg font-semibold text-white"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                            A
                        </span>
                        Aset<span className="-ml-3 text-cyan-400">Kita</span>
                    </Link>
                    <p className="mt-4 text-sm leading-7 text-slate-400">
                        Platform investasi modern untuk memahami, mengembangkan, dan
                        melindungi aset Anda.
                    </p>
                </div>
                <div className="grid gap-8 text-sm sm:grid-cols-3 sm:gap-12">
                    <FooterLinks
                        title="Platform"
                        links={[
                            ["Tentang", "/about"],
                            ["Keamanan", "/security"],
                            ["FAQ", "/faq"],
                        ]}
                    />
                    <FooterLinks
                        title="Bantuan"
                        links={[
                            ["Kontak", "/contact"],
                            ["Masuk", "/login"],
                            ["Daftar", "/register"],
                        ]}
                    />
                    <FooterLinks
                        title="Legal"
                        links={[
                            ["Kebijakan Privasi", "/security"],
                            ["Syarat & Ketentuan", "/security"],
                            ["Keamanan", "/security"],
                        ]}
                    />
                </div>
            </div>
            <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
                <p>© 2026 AsetKita. Semua hak dilindungi.</p>
                <p>Dibangun untuk investor Indonesia yang modern.</p>
            </div>
        </footer>
    );
}

function FooterLinks({
    title,
    links,
}: {
    title: string;
    links: [string, string][];
}) {
    return (
        <div>
            <h3 className="font-semibold uppercase tracking-[.2em] text-slate-300">
                {title}
            </h3>
            <ul className="mt-4 space-y-3">
                {links.map(([label, to]) => (
                    <li key={label}>
                        <Link className="transition hover:text-cyan-300" to={to}>
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function MarketingShell({ children }: MarketingShellProps) {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#060B16] text-slate-100">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-[130px]" />
                <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-teal-500/12 blur-[150px]" />
                <div className="absolute bottom-0 left-1/3 h-72 w-[55rem] rounded-full bg-blue-500/10 blur-[180px]" />
            </div>
            <MarketingHeader />
            <main className="pt-20">{children}</main>
            <MarketingFooter />
        </div>
    );
}
