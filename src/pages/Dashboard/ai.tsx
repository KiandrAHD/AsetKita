import PageFrame from "@/components/Dashboard/PageFrame";
import AIChatbot from "@/components/Dashboard/AIChatbot";

export default function AI() {
    return (
        <PageFrame
            title="AI & Belajar Investasi"
            description="Pelajari konsep keuangan, tanyakan istilah investasi, pahami risiko, dan dapatkan analisis edukatif mengenai data aset."
        >
            <div className="h-[calc(100vh-230px)] min-h-[550px] w-full">
                <AIChatbot mode="fullPage" />
            </div>
        </PageFrame>
    );
}
