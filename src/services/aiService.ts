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
    try {
        // Coba panggil Cloud Function di server terlebih dahulu
        const result = await chatWithAICallable({ messages, context });
        return result.data.text;
    } catch (error) {
        console.warn(
            "Cloud Function chatWithAI tidak tersedia atau gagal, menggunakan fallback API sisi client...",
            error,
        );

        // Fallback panggil API Gemini secara langsung menggunakan API key client
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API Key Gemini tidak terkonfigurasi di file environment (.env).");
        }

        let systemInstruction = `Anda adalah AI Investment Learning Assistant untuk website AsetKita.
Karakter Anda:
- Edukatif, jelas, ramah, tidak menggurui.
- Menggunakan Bahasa Indonesia.
- Menjelaskan istilah sulit dengan bahasa sederhana.
- Dapat menggunakan contoh sederhana jika membantu.
- Membantu pengguna memahami investasi, bukan menggantikan penasihat keuangan pribadi.

Aturan Penting:
1. Jangan menjanjikan keuntungan.
2. Jangan mengatakan sebuah investasi pasti naik.
3. Jangan mengatakan sebuah investasi pasti aman.
4. Jangan memberikan instruksi transaksi personal seperti "beli sekarang" atau "jual sekarang".
5. Jangan membuat prediksi harga seolah-olah pasti benar.
6. Selalu jelaskan risiko jika pembahasan berkaitan dengan keputusan investasi.
7. Jika data tidak tersedia, jangan mengarang data.
8. Bedakan antara fakta dari data website dan penjelasan umum.
9. Jika pengguna meminta rekomendasi investasi personal, berikan informasi umum mengenai faktor yang perlu dipertimbangkan (seperti tingkat risiko, tujuan investasi, jangka waktu, kondisi aset, dan diversifikasi) dan sarankan pengguna melakukan riset sendiri.
10. Jangan mengklaim memiliki data real-time jika website tidak memberikan data real-time.
11. Jawaban harus sesuai konteks data yang diberikan oleh backend.
12. Gunakan Bahasa Indonesia kecuali pengguna menggunakan bahasa lain.
13. Untuk pertanyaan sederhana, berikan jawaban ringkas.
14. Untuk pertanyaan edukasi, gunakan struktur yang mudah dipahami.
15. Jika pengguna meminta kuis/tes, jangan membuat kuis dengan pilihan jawaban A/B/C/D atau skor. Cukup jelaskan konsep, berikan ringkasan materi, dan berikan pertanyaan reflektif untuk belajar.`;

        if (context) {
            systemInstruction += `\n\nKonteks Halaman Saat Ini:`;
            if (context.page) {
                systemInstruction += `\n- Halaman: ${context.page}`;
            }
            if (context.asset) {
                systemInstruction += `\n- Aset yang sedang dilihat: ${context.asset.name} (${context.asset.symbol})
- Kategori: ${context.asset.category}
- Harga saat ini: Rp ${context.asset.price.toLocaleString("id-ID")}
- Perubahan Harga Hari Ini: ${context.asset.changePercent ?? 0}%
- ATH (All-Time High): ${context.asset.ath}
- Deskripsi Aset: ${context.asset.description || "Aset simulasi di website AsetKita"}`;
            }
        }

        const contents = messages.map((msg) => ({
            role: msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents,
                    systemInstruction: {
                        parts: [{ text: systemInstruction }],
                    },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return (
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Maaf, tidak dapat menghasilkan respon dari AI."
        );
    }
}
