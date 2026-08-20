# Riwayat Integrasi & Pembelajaran AI Assistant (AsetKita)

Dokumen ini mencatat seluruh arsitektur, konfigurasi, sejarah masalah, dan pembelajaran dalam pengembangan fitur **AsetKita AI Assistant** (Gemini AI Integration). Gunakan dokumen ini sebagai acuan agar tidak mengulang kesalahan yang sama di masa mendatang.

---

## 1. Arsitektur Integrasi AI (Dual-Layer Approach)

AsetKita menggunakan strategi **Dual-Layer** untuk pemanggilan Gemini API agar aplikasi tetap responsif baik saat di lingkungan production maupun local development:

```
[User Chat Input]
        │
        ▼
[src/services/aiService.ts]
        │
        ├─► (Primary) ──► Firebase Cloud Function (`chatWithAI`) ──► Gemini API
        │                  (Aman, Key tersimpan di Secret Manager)
        │
        └─► (Fallback) ──► Direct REST API Call (Client-Side) ──► Gemini API
                           (Digunakan jika Cloud Function offline / dev local)
                           (Menggunakan `VITE_GEMINI_API_KEY` dari `.env`)
```

---

## 2. File & Komponen Terkait AI

| Lokasi File | Peran / Deskripsi |
| :--- | :--- |
| `functions/src/index.ts` | **Backend Cloud Function (`chatWithAI`)**: Menggunakan `defineSecret("GEMINI_API_KEY")`, Firebase v2 `onCall`, region `asia-southeast2`. |
| `src/services/aiService.ts` | **Client-Side AI Service**: Mengatur komunikasi dengan Cloud Function, menyediakan fallback client-side `fetch()`, serta membentuk prompt & context payload. |
| `src/pages/AiBelajar.tsx` | **Halaman UI AI & Belajar**: Antarmuka obrolan interaktif, pilihan topik cepat (Belajar Investasi, Jelaskan Data Aset, Pelajari Risiko), serta penanganan status error. |
| `.env` | **Environment Variables**: Menyimpan `VITE_GEMINI_API_KEY`. |

---

## 3. System Prompt & Guardrails Keuangan

AsetKita AI adalah **AI Investment Learning Assistant**, bukan penasihat keuangan pribadi berlisensi. Prompt sistem diatur secara ketat di `functions/src/index.ts` dan `src/services/aiService.ts` dengan aturan berikut:

1. **Bahasa & Nada**: Bahasa Indonesia, edukatif, jelas, ramah, tidak menggurui.
2. **Keuangan & Risiko**:
   - DILARANG menjanjikan keuntungan atau memprediksi harga pasti.
   - DILARANG menyatakan sebuah aset pasti naik atau pasti aman.
   - DILARANG memberikan instruksi transaksi personal (seperti "Beli sekarang" / "Jual sekarang").
   - Selalu sertakan penjelasan risiko.
3. **Reflektif Kuis**: Jika pengguna meminta tes/kuis, AI TIDAK membuat kuis pilihan ganda A/B/C/D bertipe skor, melainkan memberikan pertanyaan reflektif untuk melatih pemahaman.
4. **Context-Aware**: AI menerima data halaman aktif (`page`) dan detail aset (`symbol`, `price`, `changePercent`, `ath`, `description`) agar jawaban relevan dengan apa yang sedang dilihat pengguna.

---

## 4. Sejarah Masalah & Pembelajaran Penting (Troubleshooting Log)

### 📌 Masalah 1: Error 401 (`ACCESS_TOKEN_TYPE_UNSUPPORTED`)
- **Penyebab**: API Key yang diinputkan diawali dengan `AQ.Ab...` (Format GCP Auth Key / Access Token baru dari Google AI Studio). REST API Gemini menolak format ini jika hanya dikirim lewat query URL parameter (`?key=AQ.Ab...`).
- **Pembelajaran & Solusi Code**:
  - `aiService.ts` dan `functions/src/index.ts` diperbarui agar mendukung kunci `AQ.Ab...` dengan mengirimkannya lewat HTTP Header `Authorization: Bearer <KEY>` dan `x-goog-api-key: <KEY>`.

### 📌 Masalah 2: Error 401 (`API_KEY_SERVICE_BLOCKED`)
- **Penyebab**: API Key dibuat di AI Studio dengan memilih GCP Project existing (`AsetKita` / `asetkita-388b6`), namun layanan **Generative Language API** di Google Cloud Console belum diaktifkan (*Enabled*) untuk project tersebut.
- **Pembelajaran & Solusi**:
  - **Cara A (Paling Direkomendasikan)**: Buat API Key di [Google AI Studio](https://aistudio.google.com/app/apikey) dengan memilih **`Create API key in new project`**. Kunci berawalan `AIzaSy...` akan terbit dan langsung aktif tanpa blokir GCP.
  - **Cara B**: Buka [Google Cloud Console - Generative Language API](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com), pilih project `asetkita-388b6`, lalu klik tombol **ENABLE**.

### 📌 Masalah 3: Cloud Function Offline saat Local Dev
- **Penyebab**: Saat me-run frontend Vite saja (`npm run dev`) tanpa menjalankan Firebase Emulator / Deploy Function, panggilan `httpsCallable(functions, "chatWithAI")` akan melempar warning.
- **Pembelajaran**: Hal ini **normal** dan sudah ditangani oleh mekanisme Fallback di `aiService.ts`. Sistem otomatis berpindah menggunakan `VITE_GEMINI_API_KEY` client-side tanpa membuat aplikasi crash.

---

## 5. Checklist Pengujian & Checklist Pemeliharaan AI

Saat memperbarui fitur AI di masa mendatang, pastikan:
- [ ] File `.env` memiliki `VITE_GEMINI_API_KEY` berawalan `AIzaSy...` yang valid.
- [ ] Generative Language API sudah berstatus **ENABLED** di Google Cloud Console jika menggunakan project Firebase `asetkita-388b6`.
- [ ] Aturan Guardrails pada System Instruction tidak terhapus saat melakukan refactoring.
- [ ] Saat deploy ke Firebase production, update secret `GEMINI_API_KEY` menggunakan perintah:
  `firebase functions:secrets:set GEMINI_API_KEY`
