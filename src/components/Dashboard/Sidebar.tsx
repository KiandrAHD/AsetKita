import {
    BarChart3,
    Bell,
    Bot,
    ChevronLeft,
    History,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Star,
    UserRound,
    WalletCards,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "@/services/authService";
import { clearDemoSession, getDemoSession } from "@/services/demoService";
const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/portfolio", label: "Portofolio", icon: WalletCards },
    { to: "/market", label: "Market", icon: BarChart3 },
    { to: "/ai", label: "AI & Belajar", icon: Bot },
    { to: "/watchlist", label: "Watchlist", icon: Star },
    { to: "/transactions", label: "Transaksi", icon: History },
];
export default function Sidebar({
    collapsed,
    onToggle,
    mobile = false,
    onClose,
}: {
    collapsed: boolean;
    onToggle: () => void;
    mobile?: boolean;
    onClose?: () => void;
}) {
    const navigate = useNavigate();
    const demo = getDemoSession();
    const leave = async () => {
        clearDemoSession();
        await logout();
        navigate("/login", { replace: true });
    };
    const item =
        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white";
    return (
        <aside
            className={`flex h-full flex-col border-r border-white/10 bg-[#08111d]/95 p-3 backdrop-blur-xl ${collapsed && !mobile ? "w-20" : "w-64"}`}
        >
            <Link
                to="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 px-2 py-3 text-lg font-semibold text-white"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                    <BarChart3 size={19} />
                </span>
                {(!collapsed || mobile) && "AsetKita"}
            </Link>
            <nav className="mt-7 flex-1 space-y-1">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `${item} ${isActive ? "bg-cyan-400/10 text-cyan-300" : ""}`
                        }
                    >
                        <Icon size={19} />
                        <span className={collapsed && !mobile ? "sr-only" : ""}>
                            {label}
                        </span>
                    </NavLink>
                ))}
            </nav>
            <div className="space-y-1 border-t border-white/10 pt-3">
                <NavLink to="/profile" onClick={onClose} className={item}>
                    <UserRound size={19} />
                    <span className={collapsed && !mobile ? "sr-only" : ""}>Profile</span>
                </NavLink>
                <NavLink to="/settings" onClick={onClose} className={item}>
                    <Settings size={19} />
                    <span className={collapsed && !mobile ? "sr-only" : ""}>
                        Pengaturan
                    </span>
                </NavLink>
                <button
                    onClick={() => void leave()}
                    className={`${item} w-full text-left hover:text-rose-300`}
                >
                    <LogOut size={19} />
                    <span className={collapsed && !mobile ? "sr-only" : ""}>Logout</span>
                </button>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">
                    {(demo?.nickname ?? "A").slice(0, 1).toUpperCase()}
                </span>
                {(!collapsed || mobile) && (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                            {demo?.nickname ?? "AsetKita Member"}
                        </p>
                        <p className="text-xs text-slate-400">
                            {demo?.isDemo ? "Akun demo" : "Investor"}
                        </p>
                    </div>
                )}
            </div>
            {!mobile && (
                <button
                    onClick={onToggle}
                    className="mt-3 flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                >
                    <ChevronLeft className={collapsed ? "rotate-180" : ""} size={18} />
                </button>
            )}
        </aside>
    );
}
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="rounded-xl border border-white/10 p-2 text-slate-300 lg:hidden"
        >
            <Menu size={20} />
        </button>
    );
}
export function NotificationLink() {
    return (
        <Link
            to="/notification"
            aria-label="Notifikasi"
            className="relative rounded-xl border border-white/10 p-2 text-slate-300"
        >
            <Bell size={18} />
            <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300" />
        </Link>
    );
}
