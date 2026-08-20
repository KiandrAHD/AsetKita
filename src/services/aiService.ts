import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { auth, default as firebaseApp } from "@/lib/firebase";
import { getDemoSession } from "@/services/demoService";

export interface ChatMessage {
    role: "user" | "model";
    content: string;
}

export interface ChatContext {
    page?: string;
    asset?: {
        id: string;
        name: string;
        symbol: string;
        category: string;
        price: number;
        changePercent?: number;
        ath: number;
        currency: string;
        description?: string;
    };
}

const AI_MODEL = import.meta.env.VITE_FIREBASE_AI_MODEL || "gemini-3.6-flash";
const MAX_HISTORY_MESSAGES = 20;
const SYSTEM_INSTRUCTION = `Anda adalah AsetKita AI Assistant, seorang AI Investment Learning Assistant.
Gunakan Bahasa Indonesia dengan gaya edukatif, jelas, sederhana, profesional, dan tidak menggurui.
Bantu pemula memahami saham, kripto, logam mulia, investasi, risiko, diversifikasi, portofolio, transaksi, market, istilah finansial, dan strategi belajar investasi.
Jangan menjanjikan keuntungan, menyatakan aset pasti naik atau turun, memberi jaminan, atau menyuruh pengguna membeli maupun menjual aset tertentu.
Jangan memberikan nasihat finansial personal yang definitif. Jelaskan faktor yang perlu dipertimbangkan seperti tujuan, toleransi risiko, jangka waktu, dan diversifikasi.
Bedakan data simulasi AsetKita dari data pasar nyata. Jangan mengaku memiliki data real-time jika tidak tersedia dan jangan mengarang data yang tidak ada.
Jika konteks aset diberikan, gunakan hanya informasi tersebut dan sebut harga sebagai harga simulasi AsetKita.`;

const model = getGenerativeModel(getAI(firebaseApp, { backend: new GoogleAIBackend() }), {
    model: AI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
});

function mapAIError(error: unknown): Error {
    const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code).toLowerCase()
        : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const status = typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 0;
    if (code.includes("unauthenticated") || code.includes("permission") || message.includes("auth"))
        return new Error("Silakan masuk ke akun AsetKita untuk menggunakan AI.");
    if (code.includes("app-check") || code.includes("appcheck") || message.includes("app check") || message.includes("app_check"))
        return new Error("Perlindungan keamanan AI belum siap. Silakan refresh halaman.");
    if (code.includes("quota") || code.includes("resource-exhausted") || message.includes("quota") || message.includes("429"))
        return new Error("Layanan AI sedang mencapai batas penggunaan. Silakan coba beberapa saat lagi.");
    if (code.includes("network") || message.includes("network") || message.includes("fetch"))
        return new Error("Tidak dapat terhubung ke AI. Periksa koneksi internet Anda.");
    if (status === 400 || message.includes("model") && (message.includes("not found") || message.includes("not supported")))
        return new Error("Model AI belum tersedia. Periksa model Firebase AI Logic di konfigurasi project.");
    if (status === 403 || message.includes("api not enabled") || message.includes("permission denied") || message.includes("failed precondition"))
        return new Error("Konfigurasi Firebase AI Logic belum siap. Aktifkan Firebase AI Logic dan Gemini Developer API di Firebase Console.");
    return new Error("AI sedang mengalami gangguan. Silakan coba lagi.");
}

function getAIErrorCategory(error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("app check") || message.includes("app_check")) return "app-check";
    if (message.includes("quota") || message.includes("429")) return "quota";
    if (message.includes("network") || message.includes("fetch")) return "network";
    if (message.includes("model") || message.includes("api not enabled") || message.includes("permission")) return "configuration";
    return "provider";
}

export async function getAIChatResponse(
    messages: ChatMessage[],
    context?: ChatContext,
): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Silakan masuk ke akun AsetKita untuk menggunakan AI.");
    if (getDemoSession()?.isDemo || user.getIdTokenResult && (await user.getIdTokenResult()).claims.demo === true) {
        throw new Error("AI tidak tersedia untuk akun Demo.");
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_HISTORY_MESSAGES) {
        throw new Error("Percakapan AI tidak valid.");
    }
    if (messages.some((message) => typeof message.content !== "string" || !message.content.trim())) {
        throw new Error("Pesan harus diisi.");
    }
    if (messages.some((message) => message.content.length > 4000)) {
        throw new Error("Pesan terlalu panjang. Silakan ringkas pertanyaan Anda.");
    }

    try {
        console.info("AI request started", { model: AI_MODEL, messageCount: messages.length });
        const history = messages.slice(0, -1).map((message) => ({
            role: message.role,
            parts: [{ text: message.content }],
        }));
        const prompt = [
            context?.page ? `Halaman aktif: ${context.page}.` : "",
            context?.asset
                ? `Data simulasi AsetKita: ${JSON.stringify(context.asset)}.`
                : "",
            messages[messages.length - 1].content,
        ].filter(Boolean).join("\n");
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(prompt);
        const text = result.response.text().trim();
        if (!text) throw new Error("empty_response");
        console.info("AI request completed", { model: AI_MODEL, status: "success" });
        return text;
    } catch (error: unknown) {
        console.error("AI request failed", {
            model: AI_MODEL,
            status: "error",
            category: getAIErrorCategory(error),
        });
        throw mapAIError(error);
    }
}
