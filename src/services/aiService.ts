import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
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

const MAX_HISTORY_MESSAGES = 20;
const chatWithAI = httpsCallable<
    { message: string; history: ChatMessage[]; context?: ChatContext },
    { success: true; message: string; model: string }
>(functions, "chatWithAI");

function mapAIError(error: unknown): Error {
    const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code).toLowerCase()
        : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (code.includes("unauthenticated") || code.includes("permission-denied") || message.includes("auth"))
        return new Error("Silakan masuk ke akun AsetKita untuk menggunakan AI.");
    if (code.includes("resource-exhausted") || message.includes("quota") || message.includes("429"))
        return new Error("Layanan AI sedang mencapai batas penggunaan. Silakan coba beberapa saat lagi.");
    if (code.includes("unavailable") || code.includes("deadline-exceeded") || message.includes("network") || message.includes("fetch"))
        return new Error("Tidak dapat terhubung ke AI. Periksa koneksi internet Anda.");
    if (code.includes("failed-precondition") || message.includes("configuration") || message.includes("model"))
        return new Error("Konfigurasi Gemini belum siap. Periksa Gemini API dan model di environment backend.");
    if (code.includes("invalid-argument"))
        return new Error("Pertanyaan AI tidak valid.");
    return new Error("AI sedang mengalami gangguan. Silakan coba lagi.");
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
        const currentMessage = messages[messages.length - 1];
        const result = await chatWithAI({
            message: currentMessage.content,
            history: messages.slice(0, -1),
            context,
        });
        return result.data.message;
    } catch (error: unknown) {
        throw mapAIError(error);
    }
}
