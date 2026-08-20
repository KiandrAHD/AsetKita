import { useOutletContext } from "react-router-dom";
import { auth } from "@/lib/firebase";
import Header from "@/components/Dashboard/Header";
import { useDashboard } from "@/hooks/useDashboard";
import { getDemoSession } from "@/services/demoService";

export default function PageFrame({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    const context = useOutletContext<{ openMobileMenu: () => void }>();
    const openMobileMenu = context?.openMobileMenu ?? (() => undefined);
    const { data } = useDashboard(auth.currentUser);
    const demoSession = getDemoSession();
    const profile = data?.profile ?? {
        uid: demoSession?.email ? `user_${demoSession.email}` : "demo",
        name: demoSession?.nickname ?? "Investor",
        email: demoSession?.email,
        phone: demoSession?.nomorHP,
        financialScore: 0,
    };
    return (
        <>
            <Header profile={profile} onMenu={openMobileMenu} />
            <section className="w-full p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
                {children}
            </section>
        </>
    );
}
