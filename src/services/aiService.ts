import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

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

const chatWithAICallable = httpsCallable<
    { messages: ChatMessage[]; context?: ChatContext },
    { text: string }
>(functions, "chatWithAI");

export async function getAIChatResponse(
    messages: ChatMessage[],
    context?: ChatContext,
): Promise<string> {
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
        throw new Error("Percakapan AI tidak valid.");
    }
    if (messages.some((message) => !message.content.trim() || message.content.length > 4000)) {
        throw new Error("Pesan harus diisi dan maksimal 4.000 karakter.");
    }

    try {
        const result = await chatWithAICallable({ messages, context });
        return result.data.text;
    } catch (error: unknown) {
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";
        const messagesByCode: Record<string, string> = {
            "functions/unauthenticated": "Silakan masuk ke akun AsetKita untuk menggunakan AI.",
            "functions/permission-denied": "Anda tidak memiliki akses ke fitur AI.",
            "functions/failed-precondition": "Layanan AI sedang mengalami masalah konfigurasi.",
            "functions/resource-exhausted": "Layanan AI sedang mencapai batas penggunaan. Silakan coba beberapa saat lagi.",
            "functions/internal": "AI sedang mengalami gangguan. Silakan coba lagi.",
            "functions/unavailable": "Tidak dapat terhubung ke layanan AI. Periksa koneksi internet Anda.",
            "functions/deadline-exceeded": "Layanan AI tidak merespons tepat waktu. Silakan coba lagi.",
        };
        throw new Error(messagesByCode[code] ?? "AI sedang mengalami gangguan. Silakan coba lagi.");
    }
}
