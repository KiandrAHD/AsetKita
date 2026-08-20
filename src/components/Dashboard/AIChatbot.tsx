import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
    BookOpen,
    Bot,
    Loader2,
    HelpCircle,
    RotateCcw,
    Send,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    X,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    LockKeyhole,
} from "lucide-react";

import { assets } from "@/data/assets";
import { getMarketPrices } from "@/services/marketService";
import { type ChatContext, type ChatMessage, getAIChatResponse } from "@/services/aiService";
import { getDemoSession } from "@/services/demoService";
import { auth } from "@/lib/firebase";

interface AIChatbotProps {
    mode?: "floating" | "fullPage";
}

const SUGGESTIONS = [
    { label: "💡 Apa itu saham?", prompt: "Apa itu saham?" },
    { label: "📚 Jelaskan apa itu diversifikasi", prompt: "Jelaskan apa itu diversifikasi dalam investasi dan mengapa penting?" },
    { label: "⚠️ Apa saja risiko investasi?", prompt: "Apa saja risiko dalam berinvestasi?" },
    { label: "📊 Bagaimana cara membaca data investasi?", prompt: "Bagaimana cara membaca data investasi/aset?" },
    { label: "🧠 Pelajari investasi terstruktur", prompt: "Bantu saya belajar investasi secara terstruktur. Berikan penjelasan konsep dasar dan beberapa pertanyaan reflektif untuk belajar secara bertahap." }
];

const QUICK_ACTIONS = [
    { label: "📚 Belajar Investasi", prompt: "Saya ingin belajar dasar-dasar investasi.", icon: BookOpen },
    { label: "📊 Jelaskan Data Aset", prompt: "Jelaskan kondisi aset dan data investasi yang sedang saya lihat saat ini.", icon: TrendingUp },
    { label: "⚠️ Pelajari Risiko", prompt: "Apa saja risiko investasi dan bagaimana cara meminimalkannya?", icon: AlertTriangle },
    { label: "🧠 Belajar Interaktif", prompt: "Berikan penjelasan konsep investasi dan beberapa pertanyaan reflektif untuk mengetes pemahaman saya.", icon: HelpCircle }
];

export default function AIChatbot({ mode = "floating" }: AIChatbotProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { assetId } = useParams();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [failedConversation, setFailedConversation] = useState<ChatMessage[] | null>(null);
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);

    const [pageContext, setPageContext] = useState("Dashboard");
    const [assetContext, setAssetContext] = useState<ChatContext["asset"]>(undefined);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setAuthReady(true);
    }), []);

    const demoBlocked = getDemoSession()?.isDemo === true;
    const accessMessage = authReady && !user
        ? "Silakan masuk ke akun AsetKita untuk menggunakan AI."
        : demoBlocked
            ? "AI tidak tersedia untuk akun Demo. Gunakan akun AsetKita untuk mengakses AI & Belajar."
            : null;

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading, isOpen]);

    // Context detection based on route
    useEffect(() => {
        const path = location.pathname;
        let pageName = "Dashboard";
        let activeAsset = undefined;

        if (path.includes("/market/")) {
            pageName = "Detail Aset";
            const id = assetId || path.split("/").pop();
            if (id) {
                activeAsset = assets.find((a) => a.id === id);
            }
        } else if (path.includes("/portfolio")) {
            pageName = "Portofolio";
        } else if (path.includes("/market")) {
            pageName = "Market / Pasar";
        } else if (path.includes("/watchlist")) {
            pageName = "Watchlist";
        } else if (path.includes("/transactions")) {
            pageName = "Riwayat Transaksi";
        } else if (path.includes("/profile")) {
            pageName = "Profil Pengguna";
        } else if (path.includes("/settings")) {
            pageName = "Pengaturan";
        } else if (path.includes("/notification")) {
            pageName = "Notifikasi";
        } else if (path.includes("/ai")) {
            pageName = "AI & Belajar";
        }

        const pageContextTimer = window.setTimeout(() => setPageContext(pageName), 0);

        if (activeAsset) {
            getMarketPrices()
                .then((prices) => {
                    const live = prices[activeAsset.id];
                    setAssetContext({
                        id: activeAsset.id,
                        name: activeAsset.name,
                        symbol: activeAsset.symbol,
                        category: activeAsset.category,
                        price: live?.price ?? activeAsset.basePrice,
                        changePercent: live?.changePercent ?? 0,
                        ath: activeAsset.ath,
                        currency: activeAsset.currency,
                        description: `${activeAsset.name} adalah aset ${activeAsset.category} di platform AsetKita.`,
                    });
                })
                .catch(() => {
                    setAssetContext({
                        id: activeAsset.id,
                        name: activeAsset.name,
                        symbol: activeAsset.symbol,
                        category: activeAsset.category,
                        price: activeAsset.basePrice,
                        changePercent: 0,
                        ath: activeAsset.ath,
                        currency: activeAsset.currency,
                        description: `${activeAsset.name} adalah aset ${activeAsset.category} di platform AsetKita.`,
                    });
                });
        } else {
            const assetContextTimer = window.setTimeout(() => setAssetContext(undefined), 0);
            return () => {
                window.clearTimeout(pageContextTimer);
                window.clearTimeout(assetContextTimer);
            };
        }

        return () => window.clearTimeout(pageContextTimer);
    }, [location.pathname, assetId]);

    // Send a message
    const handleSend = async (textToSend: string) => {
        const trimmedText = textToSend.trim();
        if (!trimmedText || isLoading) return;
        if (!authReady || accessMessage) {
            setError(accessMessage ?? "Silakan masuk ke akun AsetKita untuk menggunakan AI.");
            return;
        }
        if (trimmedText.length > 4000) {
            setError("Pesan terlalu panjang. Batasi pertanyaan hingga 4.000 karakter.");
            return;
        }
        if (messages.length >= 20) {
            setError("Percakapan sudah mencapai batas 20 pesan. Bersihkan percakapan untuk melanjutkan.");
            return;
        }

        setError(null);
        setFailedConversation(null);
        const userMsg: ChatMessage = { role: "user", content: trimmedText };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            // Build current context payload
            const context: ChatContext = {
                page: pageContext,
                asset: assetContext,
            };

            const responseText = await getAIChatResponse(updatedMessages, context);
            setMessages((prev) => [...prev, { role: "model", content: responseText }]);
        } catch (err: unknown) {
            console.error("AI request failed", err);
            setFailedConversation(updatedMessages);
            setError(getDemoSession()?.isDemo
                ? "Fitur AI hanya tersedia untuk pengguna yang sudah masuk dengan akun AsetKita."
                : err instanceof Error ? err.message : "AI sedang mengalami gangguan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = async () => {
        if (!failedConversation || isLoading || accessMessage) return;
        setError(null);
        setIsLoading(true);
        try {
            const responseText = await getAIChatResponse(failedConversation, {
                page: pageContext,
                asset: assetContext,
            });
            setMessages((prev) => [...prev, { role: "model", content: responseText }]);
            setFailedConversation(null);
        } catch (err: unknown) {
            console.error("AI retry failed", err);
            setError(err instanceof Error ? err.message : "AI sedang mengalami gangguan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(input);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        setError(null);
    };

    // Helper to format inline markdown inside chat bubbles
    const renderMessageContent = (content: string) => {
        const lines = content.split("\n");
        return lines.map((line, lineIdx) => {
            const trimmed = line.trim();

            if (trimmed.startsWith("### ")) {
                return (
                    <h4 key={lineIdx} className="mt-3 mb-1 text-sm font-bold text-cyan-300">
                        {trimmed.replace("### ", "")}
                    </h4>
                );
            }
            if (trimmed.startsWith("## ")) {
                return (
                    <h3 key={lineIdx} className="mt-4 mb-1.5 text-base font-bold text-white">
                        {trimmed.replace("## ", "")}
                    </h3>
                );
            }
            if (trimmed.startsWith("# ")) {
                return (
                    <h2 key={lineIdx} className="mt-4 mb-2 text-lg font-bold text-white">
                        {trimmed.replace("# ", "")}
                    </h2>
                );
            }

            // Bullet list
            if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                const cleanText = trimmed.substring(2);
                return (
                    <ul key={lineIdx} className="list-disc pl-5 my-1 space-y-0.5">
                        <li className="text-sm text-slate-300">{parseInlineMarkdown(cleanText)}</li>
                    </ul>
                );
            }

            // Numbered list
            const numberedMatch = trimmed.match(/^(\d+)\.\s(.*)/);
            if (numberedMatch) {
                const num = numberedMatch[1];
                const cleanText = numberedMatch[2];
                return (
                    <ol key={lineIdx} className="list-decimal pl-5 my-1 space-y-0.5">
                        <li value={parseInt(num)} className="text-sm text-slate-300">
                            {parseInlineMarkdown(cleanText)}
                        </li>
                    </ol>
                );
            }

            return trimmed === "" ? (
                <div key={lineIdx} className="h-2" />
            ) : (
                <p key={lineIdx} className="mb-1 text-sm leading-relaxed text-slate-300">
                    {parseInlineMarkdown(line)}
                </p>
            );
        });
    };

    const parseInlineMarkdown = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={idx} className="font-bold text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    // Chat Window HTML markup
    const chatWindow = (
        <div className="flex h-full flex-col bg-[#101C2F] text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0d1727]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">AsetKita AI Assistant</h4>
                        <div className="flex items-center gap-1.5 text-xs text-cyan-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>AI Investment Assistant</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            title="Bersihkan Percakapan"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-300 transition"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                    {mode === "floating" && (
                        <>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? "Expand" : "Minimize"}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition"
                            >
                                {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Tutup"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-400 transition"
                            >
                                <X size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Context Widget Banner */}
            {(assetContext || pageContext) && (
                <div className="flex items-center justify-between border-b border-white/5 bg-[#08111F]/60 px-4 py-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                        <span>Konteks: <strong className="text-slate-300">{pageContext}</strong></span>
                    </div>
                    {assetContext && (
                        <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 font-medium text-cyan-300">
                            {assetContext.symbol} · Rp {assetContext.price.toLocaleString("id-ID")}
                        </span>
                    )}
                </div>
            )}

            {/* Messages Container */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
                {accessMessage ? (
                    <div className="flex h-full min-h-64 flex-col items-center justify-center px-5 text-center">
                        <LockKeyhole className="mb-4 text-amber-300" size={30} />
                        <h5 className="font-semibold text-white">
                            {demoBlocked ? "AI tidak tersedia untuk akun Demo" : "Masuk untuk menggunakan AI"}
                        </h5>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                            {demoBlocked
                                ? "Gunakan akun AsetKita untuk mengakses AI & Belajar."
                                : "Silakan masuk ke akun AsetKita untuk menggunakan AI."}
                        </p>
                        <div className="mt-5 flex gap-2">
                            <button onClick={() => navigate("/login")} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950">
                                Masuk
                            </button>
                            <button onClick={() => navigate("/register")} className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-semibold text-cyan-300">
                                Buat Akun
                            </button>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    /* Empty State */
                    <div className="flex h-full flex-col justify-center py-6">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                            <Bot size={32} />
                        </div>
                        <h5 className="text-center font-semibold text-white mb-1">Halo! Saya AsetKita AI Assistant</h5>
                        <p className="text-center text-xs text-slate-400 max-w-xs mx-auto px-4 mb-6 leading-relaxed">
                            Saya dapat membantu Anda memahami konsep investasi, istilah keuangan, risiko, dan menganalisis data aset di platform AsetKita.
                        </p>

                        <div className="space-y-2 px-2 max-w-sm mx-auto w-full">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Pertanyaan yang disarankan:</p>
                            {SUGGESTIONS.map((sug, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(sug.prompt)}
                                    className="w-full text-left text-xs bg-[#08111F] hover:bg-cyan-950/20 border border-[#1F3557] hover:border-cyan-500/50 p-2.5 rounded-xl text-slate-300 transition-all duration-200"
                                >
                                    {sug.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Messages List */
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                            ? "bg-cyan-400 text-slate-950 font-medium rounded-tr-none shadow-lg shadow-cyan-950/15"
                                            : "bg-[#08111F] border border-[#1F3557] text-slate-200 rounded-tl-none"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <div>{renderMessageContent(msg.content)}</div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading / Generating State */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-[#1F3557] bg-[#08111F] px-4 py-3 text-slate-200 flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                                    <span className="text-xs text-slate-400">AI sedang memproses jawaban...</span>
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
                                <p className="font-semibold mb-1 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> Terjadi Kendala
                                </p>
                                <p>{error}</p>
                                {getDemoSession()?.isDemo && (
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={() => navigate("/login")} className="rounded-lg bg-cyan-400 px-3 py-1.5 font-semibold text-slate-950">Masuk</button>
                                        <button onClick={() => navigate("/register")} className="rounded-lg border border-cyan-400/40 px-3 py-1.5 font-semibold text-cyan-300">Buat Akun</button>
                                    </div>
                                )}
                                <button
                                    onClick={() => void handleRetry()}
                                    className="mt-2 text-cyan-400 font-semibold hover:underline"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Bar */}
            <div className="border-t border-white/5 bg-[#0a121f] px-3 py-2">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_ACTIONS.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSend(action.prompt)}
                                disabled={isLoading || !authReady || Boolean(accessMessage)}
                                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon size={12} />
                                <span>{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer Input Area */}
            <div className="border-t border-white/10 p-3 bg-[#0d1727]">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                    }}
                    className="flex items-end gap-2"
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isLoading ? "AI sedang mengetik..." : "Tanyakan sesuatu tentang investasi..."}
                        disabled={isLoading || !authReady || Boolean(accessMessage)}
                        rows={1}
                        className="flex-1 max-h-24 min-h-[40px] resize-none rounded-xl border border-[#1F3557] bg-[#08111F] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || !authReady || Boolean(accessMessage)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:bg-[#1E3351] disabled:text-slate-500 transition duration-200"
                    >
                        <Send size={16} />
                    </button>
                </form>
                <p className="mt-1.5 text-center text-[10px] text-slate-500">
                    AI dapat melakukan kekeliruan. Selalu lakukan riset Anda sendiri sebelum berinvestasi.
                </p>
            </div>
        </div>
    );

    // Render based on mode
    if (mode === "fullPage") {
        return (
            <div className="flex h-full min-h-[500px] flex-col rounded-[2rem] border border-white/10 bg-[#101C2F] overflow-hidden shadow-2xl">
                {chatWindow}
            </div>
        );
    }

    // Floating Mode Layout
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Expanded Chat Drawer */}
            {isOpen && (
                <div
                    className={`mb-4 flex w-full max-w-[92vw] flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 sm:w-96 ${isMinimized ? "h-[56px]" : "h-[500px] md:h-[550px]"
                        }`}
                >
                    {chatWindow}
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all duration-200 z-50 group"
                    aria-label="Tanya AI Assistant"
                >
                    <MessageSquare size={24} className="group-hover:rotate-6 transition-transform" />
                </button>
            )}
        </div>
    );
}
