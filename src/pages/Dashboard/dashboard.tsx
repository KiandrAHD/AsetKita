import { useOutletContext } from "react-router-dom";
import { auth } from "@/lib/firebase";
import Header from "@/components/Dashboard/Header";
import SummaryCards from "@/components/Dashboard/SummaryCards";
import { AssetAllocation, PortfolioChart } from "@/components/Dashboard/Charts";
import PortfolioList from "@/components/Dashboard/PortfolioList";
import AiInsight from "@/components/Dashboard/AiInsight";
import QuickNavigation from "@/components/Dashboard/QuickNavigation";
import { LatestNews, MarketSummary } from "@/components/Dashboard/MarketNews";
import {
    ErrorState,
    LoadingState,
    OfflineState,
    RetryButton,
} from "@/components/Dashboard/State";
import { useDashboard } from "@/hooks/useDashboard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
type Context = { openMobileMenu: () => void };
function Dashboard() {
    const { openMobileMenu } = useOutletContext<Context>();
    const online = useOnlineStatus();
    const { data, loading, error, reload } = useDashboard(auth.currentUser);
    if (!online)
        return (
            <div className="p-6">
                <OfflineState />
            </div>
        );
    if (loading)
        return (
            <div className="p-6">
                <LoadingState />
            </div>
        );
    if (error || !data)
        return (
            <div className="p-6">
                <ErrorState />
                <div className="text-center">
                    <RetryButton onClick={() => void reload()} />
                </div>
            </div>
        );
    return (
        <>
            <Header profile={data.profile} onMenu={openMobileMenu} />
            <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
                <SummaryCards summary={data.summary} onTopUpSuccess={() => void reload()} />
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,.75fr)]">
                    <PortfolioChart data={data.chart} />
                    <AssetAllocation data={data.allocation} />
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,.75fr)]">
                    <PortfolioList holdings={data.holdings} />
                    <div className="space-y-5">
                        <AiInsight isDemo={data.mode === "demo"} />
                        <QuickNavigation />
                    </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                    <MarketSummary />
                    <LatestNews />
                </div>
            </div>
        </>
    );
}
export default Dashboard;
