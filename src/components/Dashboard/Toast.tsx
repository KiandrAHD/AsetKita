import { useEffect, useState } from "react";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

export type ToastMessage = {
    id: string;
    text: string;
    type?: "success" | "info" | "error";
};

let toastListeners: Array<(toast: ToastMessage) => void> = [];

export function showToast(text: string, type: "success" | "info" | "error" = "success") {
    const toastObj: ToastMessage = { id: `${Date.now()}-${Math.random()}`, text, type };
    toastListeners.forEach((listener) => listener(toastObj));
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleNewToast = (toast: ToastMessage) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 3200);
        };
        toastListeners.push(handleNewToast);
        return () => {
            toastListeners = toastListeners.filter((l) => l !== handleNewToast);
        };
    }, []);

    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 ${
                        t.type === "error"
                            ? "border-rose-500/30 bg-[#1c0d18]/95 text-rose-300"
                            : t.type === "info"
                            ? "border-cyan-500/30 bg-[#081827]/95 text-cyan-300"
                            : "border-emerald-500/30 bg-[#081f18]/95 text-emerald-300"
                    }`}
                >
                    {t.type === "error" ? (
                        <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                    ) : t.type === "info" ? (
                        <Info size={18} className="text-cyan-400 shrink-0" />
                    ) : (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    )}
                    <span>{t.text}</span>
                </div>
            ))}
        </div>
    );
}
