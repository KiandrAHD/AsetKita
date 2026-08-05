import type { ReactNode } from "react";
export default function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-3xl border border-white/10 bg-[#111c2d]/75 shadow-[0_18px_45px_rgba(0,0,0,.16)] backdrop-blur ${className}`}>{children}</section>; }
