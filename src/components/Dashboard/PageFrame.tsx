import { useOutletContext } from "react-router-dom";
import { auth } from "@/lib/firebase";
import Header from "@/components/Dashboard/Header";
import { useDashboard } from "@/hooks/useDashboard";
export default function PageFrame({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    const { openMobileMenu } = useOutletContext<{ openMobileMenu: () => void }>();
    const { data } = useDashboard(auth.currentUser);
    const profile = data?.profile ?? {
        uid: "",
        name: "AsetKita",
        financialScore: 0,
    };
    return (
        <>
            <Header profile={profile} onMenu={openMobileMenu} />
            <section className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
                {children}
            </section>
        </>
    );
}
