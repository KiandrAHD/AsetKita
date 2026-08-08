import { Construction } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Header from "@/components/Dashboard/Header";
import DashboardCard from "@/components/Dashboard/DashboardCard";
type Context = { openMobileMenu: () => void };
export default function PlaceholderPage({ title }: { title: string }) {
    const { openMobileMenu } = useOutletContext<Context>();
    const profile = { uid: "placeholder", name: "AsetKita", financialScore: 0 };
    return (
        <>
            <Header profile={profile} onMenu={openMobileMenu} />
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <DashboardCard className="p-8 text-center sm:p-14">
                    <Construction className="mx-auto text-cyan-300" size={34} />
                    <h2 className="mt-5 text-xl font-semibold text-white">
                        {title} sedang disiapkan
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                        Halaman ini sudah terhubung ke navigasi dan akan hadir bersama fitur
                        investasi AsetKita berikutnya.
                    </p>
                </DashboardCard>
            </div>
        </>
    );
}
