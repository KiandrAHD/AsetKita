import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
    return <main className="min-h-screen overflow-x-hidden bg-[#060B16] text-slate-100"><div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"><div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[150px]" /><div className="absolute -right-24 top-12 h-96 w-96 rounded-full bg-teal-500/10 blur-[150px]" /></div><div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">{aside && <aside className="hidden lg:block">{aside}</aside>}<div className="mx-auto w-full max-w-md"><Link to="/" className="mb-10 flex items-center justify-center gap-3 text-xl font-semibold text-white lg:justify-start"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-slate-950"><BarChart3 size={20} /></span>Aset<span className="-ml-3 text-cyan-400">Kita</span></Link>{children}</div></div></main>;
}
