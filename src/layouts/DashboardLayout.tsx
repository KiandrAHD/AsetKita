import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import AIChatbot from "@/components/Dashboard/AIChatbot";
import { ToastContainer } from "@/components/Dashboard/Toast";

function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    return (
        <div className="min-h-screen bg-[#060b14] text-slate-100 relative">
            <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
                <Sidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed((value) => !value)}
                />
            </div>
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden">
                    <div className="h-full w-72">
                        <Sidebar
                            collapsed={false}
                            mobile
                            onToggle={() => undefined}
                            onClose={() => setMobileOpen(false)}
                        />
                    </div>
                </div>
            )}
            <main
                className={`min-h-screen transition-[margin] ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}
            >
                <Outlet context={{ openMobileMenu: () => setMobileOpen(true) }} />
            </main>
            
            {/* Floating AI Investment Assistant */}
            <AIChatbot mode="floating" />

            {/* Global Toast Notifications */}
            <ToastContainer />
        </div>
    );
}

export default DashboardLayout;

