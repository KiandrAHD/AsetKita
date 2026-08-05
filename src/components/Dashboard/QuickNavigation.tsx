import { BookOpen, History, LineChart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardCard from "./DashboardCard";
const links = [{ to: "/market", label: "Market", icon: LineChart }, { to: "/watchlist", label: "Watchlist", icon: Star }, { to: "/history", label: "Riwayat", icon: History }, { to: "/ai", label: "Belajar", icon: BookOpen }];
export default function QuickNavigation() { return <DashboardCard className="p-5 sm:p-6"><h2 className="font-semibold text-white">Navigasi Cepat</h2><div className="mt-4 grid grid-cols-2 gap-3">{links.map(({ to, label, icon: Icon }) => <Link key={label} to={to} className="rounded-2xl bg-[#091321]/80 p-3 text-center text-xs font-medium text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-200"><Icon className="mx-auto mb-2 text-cyan-300" size={18} />{label}</Link>)}</div></DashboardCard>; }
