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
    if (code.includes("not-found") || message.includes("not found") || message.includes("function"))
        return new Error("Layanan AI belum ter-deploy ke Firebase project AsetKita. Deploy Cloud Functions lalu coba lagi.");
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
        console.warn("Firebase Cloud Function failed. Trying client-side fallback with API key rotation...", error);
        
        if (GEMINI_KEYS.length > 0) {
            try {
                return await getAIChatResponseFallback(messages, context);
            } catch (fallbackError) {
                console.error("Client-side fallback also failed after trying all keys:", fallbackError);
                throw fallbackError;
            }
        }
        throw mapAIError(error);
    }
}

const GEMINI_KEYS = (import.meta.env.VITE_GEMINI_API_KEYS || "")
    .split(",")
    .map((key: string) => key.trim())
    .filter(Boolean);

const STORAGE_KEY_IDX = "asetkita_gemini_key_idx";

function getActiveApiKey(): string {
    if (GEMINI_KEYS.length === 0) return "";
    let idx = parseInt(localStorage.getItem(STORAGE_KEY_IDX) || "0", 10);
    if (isNaN(idx) || idx < 0 || idx >= GEMINI_KEYS.length) {
        idx = 0;
        localStorage.setItem(STORAGE_KEY_IDX, "0");
    }
    return GEMINI_KEYS[idx];
}

function rotateApiKey(): string {
    if (GEMINI_KEYS.length === 0) return "";
    let idx = parseInt(localStorage.getItem(STORAGE_KEY_IDX) || "0", 10);
    idx = (idx + 1) % GEMINI_KEYS.length;
    localStorage.setItem(STORAGE_KEY_IDX, String(idx));
    console.warn(`Gemini API Key rotated to key index ${idx}`);
    return GEMINI_KEYS[idx];
}

const AI_SYSTEM_INSTRUCTION = `Kamu adalah "AsetKita AI Assistant", AI Investment Learning Assistant untuk AsetKita, platform edukasi dan simulasi investasi.
Gunakan Bahasa Indonesia secara default. Bersikap natural, jelas, ramah, profesional, dan mudah dipahami pemula.
Jelaskan saham, cryptocurrency, logam mulia, investasi, portofolio, transaksi, profit/loss, risiko, market, dan istilah finansial secara edukatif.
Gunakan bullet points, numbering, contoh sederhana, atau tabel sederhana jika membantu.
Jangan menjanjikan profit, mengatakan aset pasti naik atau turun, memberi jaminan, atau mendorong pembelian maupun penjualan aset tertentu.
Jika ditanya apakah harus membeli aset, jelaskan faktor pertimbangan seperti tujuan, kondisi keuangan, toleransi risiko, jangka waktu, dan diversifikasi tanpa memberi keputusan personal yang definitif.
Bedakan data simulasi AsetKita dari data pasar nyata. Jangan mengaku memiliki data real-time jika tidak diberikan dalam konteks dan jangan mengarang data pengguna.
Jika data portfolio atau saldo tidak ada di konteks, katakan bahwa data tersebut belum tersedia.
Jawaban harus generatif dan menjawab pertanyaan pengguna berdasarkan percakapan, bukan berdasarkan jawaban statis.`;

async function getAIChatResponseFallback(
    messages: ChatMessage[],
    context?: ChatContext
): Promise<string> {
    if (GEMINI_KEYS.length === 0) {
        throw new Error("Konfigurasi Gemini belum siap.");
    }

    const currentMessage = messages[messages.length - 1];
    const contextInstruction = [
        context?.page ? `Halaman: ${String(context.page)}` : "",
        context?.asset ? `Data aset simulasi AsetKita: ${JSON.stringify(context.asset)}` : "",
    ].filter(Boolean).join("\n");

    const contents = [
        ...messages.slice(0, -1).map((item) => ({
            role: item.role,
            parts: [{ text: item.content }]
        })),
        {
            role: "user",
            parts: [{ text: contextInstruction ? `${contextInstruction}\n\nPertanyaan pengguna: ${currentMessage.content}` : currentMessage.content }]
        }
    ];

    let attempts = 0;
    while (attempts < GEMINI_KEYS.length) {
        const apiKey = getActiveApiKey();
        attempts++;

        try {
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey
                    },
                    body: JSON.stringify({
                        contents,
                        systemInstruction: {
                            parts: [{ text: AI_SYSTEM_INSTRUCTION }]
                        },
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                const activeIdx = localStorage.getItem(STORAGE_KEY_IDX) || "0";
                console.error(`Gemini REST API error (Key Index ${activeIdx}):`, response.status, errorText);
                
                let parsedError = "";
                try {
                    const errJson = JSON.parse(errorText);
                    parsedError = errJson.error?.message || errorText;
                } catch {
                    parsedError = errorText;
                }

                // If rate limit (429) or auth errors (401/403/404), rotate the key and try again
                if (response.status === 429 || response.status === 401 || response.status === 403 || response.status === 404) {
                    console.warn(`API key failed with status ${response.status}. Rotating key...`);
                    rotateApiKey();
                    continue;
                }
                
                throw new Error(`Terjadi kesalahan saat menghubungi layanan AI: ${parsedError} (Status: ${response.status})`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error("Gagal mendapatkan respon dari AI.");
            }
            return text.trim();

        } catch (err: unknown) {
            if (attempts >= GEMINI_KEYS.length) {
                throw err;
            }
            console.warn(`Request failed. Rotating key and retrying...`, err);
            rotateApiKey();
        }
    }

    throw new Error("Semua Kunci API Gemini telah mencapai batas limit (Rate Limit/Quota). Silakan coba lagi nanti.");
}
