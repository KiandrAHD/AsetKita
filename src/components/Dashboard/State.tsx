import type { ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw, WifiOff } from "lucide-react";

export function EmptyState({
    title,
    description,
    icon,
}: {
    title: string;
    description: string;
    icon?: ReactNode;
}) {
    return (
        <div className="flex min-h-44 flex-col items-center justify-center px-5 py-8 text-center">
            <span className="mb-3 text-cyan-300">{icon ?? <Inbox size={28} />}</span>
            <p className="font-medium text-slate-100">{title}</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                {description}
            </p>
        </div>
    );
}
export function LoadingState() {
    return (
        <div className="animate-pulse space-y-3 p-6">
            <div className="h-4 w-1/3 rounded bg-white/10" />
            <div className="h-20 rounded-2xl bg-white/5" />
            <div className="h-4 w-2/3 rounded bg-white/10" />
        </div>
    );
}
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="text-center">
            <EmptyState
                icon={<AlertCircle size={28} />}
                title="Belum dapat memuat data"
                description="Periksa koneksi Anda, lalu coba lagi."
            />
            {onRetry && <RetryButton onClick={onRetry} />}
        </div>
    );
}
export function OfflineState() {
    return (
        <EmptyState
            icon={<WifiOff size={28} />}
            title="Anda sedang offline"
            description="Data terbaru akan tersedia saat koneksi kembali."
        />
    );
}
export function RetryButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-3 py-2 text-xs font-medium text-cyan-200"
        >
            <RefreshCw size={14} /> Coba lagi
        </button>
    );
}
