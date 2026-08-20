"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAI = exports.deleteAccount = exports.updateSettings = exports.updateProfile = exports.toggleWatchlist = exports.executeTrade = exports.updateMarketSimulation = exports.createDemoToken = exports.completePasswordReset = exports.verifyPasswordResetOtp = exports.completeRegistration = exports.requestEmailOtp = void 0;
const node_crypto_1 = require("node:crypto");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const resend_1 = require("resend");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const adminAuth = (0, auth_1.getAuth)();
const resendKey = (0, params_1.defineSecret)("RESEND_API_KEY");
const otpFromEmail = (0, params_1.defineSecret)("OTP_FROM_EMAIL");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const geminiModel = (0, params_1.defineString)("GEMINI_MODEL", { default: "gemini-3.1-flash-lite" });
const REGION = "asia-southeast2";
const TTL_MINUTES = 10;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const hash = (value) => (0, node_crypto_1.createHash)("sha256").update(value).digest("hex");
const otpId = (email, purpose) => hash(`${purpose}:${email.toLowerCase()}`);
const otpRef = (email, purpose) => db.collection("emailOtps").doc(otpId(email, purpose));
const validEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (value) => typeof value === "string" && value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const validPhone = (value) => typeof value === "string" && /^\+62(?:8\d{8,12})$/.test(value);
const validName = (value) => typeof value === "string" && value.trim().length >= 2;
const fail = (message, code = "invalid-argument") => { throw new https_1.HttpsError(code, message); };
async function consumeOtp(email, purpose, code) {
    if (!/^\d{6}$/.test(code))
        fail("Kode verifikasi harus terdiri dari 6 angka.");
    const ref = otpRef(email, purpose);
    await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        const data = snap.data();
        if (!data || data.consumedAt || data.expiresAt.toMillis() < Date.now())
            fail("Kode verifikasi tidak valid atau telah kedaluwarsa.", "failed-precondition");
        const activeOtp = data;
        if (activeOtp.attempts >= MAX_ATTEMPTS)
            fail("Terlalu banyak percobaan. Minta kode baru untuk melanjutkan.", "resource-exhausted");
        if (activeOtp.codeHash !== hash(code)) {
            transaction.update(ref, { attempts: firestore_1.FieldValue.increment(1) });
            fail("Kode verifikasi tidak tepat.", "permission-denied");
        }
        transaction.update(ref, { consumedAt: firestore_1.FieldValue.serverTimestamp() });
    });
}
exports.requestEmailOtp = (0, https_1.onCall)({ region: REGION, secrets: [resendKey, otpFromEmail] }, async (request) => {
    const { email, purpose } = request.data;
    if (!validEmail(email) || (purpose !== "register" && purpose !== "reset-password"))
        fail("Permintaan verifikasi tidak valid.");
    const normalizedEmail = email.toLowerCase().trim();
    const verifiedPurpose = purpose;
    const existing = await adminAuth.getUserByEmail(normalizedEmail).then(() => true).catch(() => false);
    if ((verifiedPurpose === "register" && existing) || (verifiedPurpose === "reset-password" && !existing))
        return { accepted: true, resendAfterSeconds: RESEND_SECONDS };
    const ref = otpRef(normalizedEmail, verifiedPurpose);
    const current = await ref.get();
    const resendAfter = current.data()?.resendAfter;
    if (resendAfter && resendAfter.toMillis() > Date.now())
        fail("Mohon tunggu sebelum meminta kode baru.", "resource-exhausted");
    const code = String((0, node_crypto_1.randomInt)(100000, 1_000_000));
    await ref.set({ email: normalizedEmail, purpose: verifiedPurpose, codeHash: hash(code), expiresAt: firestore_1.Timestamp.fromMillis(Date.now() + TTL_MINUTES * 60_000), resendAfter: firestore_1.Timestamp.fromMillis(Date.now() + RESEND_SECONDS * 1000), attempts: 0, consumedAt: null, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    const subject = verifiedPurpose === "register" ? "Kode verifikasi akun AsetKita" : "Kode pemulihan password AsetKita";
    await new resend_1.Resend(resendKey.value()).emails.send({ from: otpFromEmail.value(), to: normalizedEmail, subject, html: `<p>Gunakan kode berikut untuk melanjutkan:</p><h1 style="letter-spacing:6px">${code}</h1><p>Kode berlaku selama ${TTL_MINUTES} menit. Jangan bagikan kode ini kepada siapa pun.</p>` });
    return { accepted: true, resendAfterSeconds: RESEND_SECONDS };
});
exports.completeRegistration = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const { namaLengkap, namaPanggilan, email, nomorHP, password, otp } = request.data;
    if (!validName(namaLengkap) || !validName(namaPanggilan) || !validEmail(email) || !validPhone(nomorHP) || !validPassword(password) || typeof otp !== "string")
        fail("Data pendaftaran tidak valid.");
    const normalizedEmail = email.toLowerCase().trim();
    const verifiedPassword = password;
    const verifiedOtp = otp;
    const verifiedName = namaLengkap;
    const verifiedNickname = namaPanggilan;
    const verifiedPhone = nomorHP;
    await consumeOtp(normalizedEmail, "register", verifiedOtp);
    let user;
    try {
        user = await adminAuth.createUser({ email: normalizedEmail, password: verifiedPassword, displayName: verifiedNickname.trim(), emailVerified: true });
    }
    catch (error) {
        if (typeof error === "object" && error && "code" in error && String(error.code).includes("email-already-exists"))
            fail("Email ini sudah terdaftar.", "failed-precondition");
        throw error;
    }
    const now = firestore_1.FieldValue.serverTimestamp();
    const photoURL = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(verifiedNickname.trim())}&backgroundColor=0b1220&fontFamily=Arial`;
    const portfolioId = `${user.uid}_utama`;
    const batch = db.batch();
    batch.set(db.collection("users").doc(user.uid), { uid: user.uid, namaLengkap: verifiedName.trim(), namaPanggilan: verifiedNickname.trim(), email: normalizedEmail, nomorHP: verifiedPhone, photoURL, role: "investor", status: "aktif", emailVerified: true, financialScore: 0, primaryPortfolioId: portfolioId, createdAt: now, updatedAt: now, lastLogin: now, provider: "password" });
    batch.set(db.collection("wallets").doc(user.uid), { uid: user.uid, balance: 0, currency: "IDR", updatedAt: now, createdAt: now });
    batch.set(db.collection("portfolios").doc(portfolioId), { uid: user.uid, name: "Portofolio Utama", type: "primary", createdAt: now, updatedAt: now });
    await batch.commit();
    return { customToken: await adminAuth.createCustomToken(user.uid) };
});
exports.verifyPasswordResetOtp = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const { email, otp } = request.data;
    if (!validEmail(email) || typeof otp !== "string")
        fail("Permintaan verifikasi tidak valid.");
    const normalizedEmail = email.toLowerCase().trim();
    await consumeOtp(normalizedEmail, "reset-password", otp);
    const ticket = (0, node_crypto_1.randomBytes)(32).toString("hex");
    await db.collection("passwordResetTickets").doc(hash(ticket)).set({ email: normalizedEmail, expiresAt: firestore_1.Timestamp.fromMillis(Date.now() + 10 * 60_000), consumedAt: null, createdAt: firestore_1.FieldValue.serverTimestamp() });
    return { resetTicket: ticket };
});
exports.completePasswordReset = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const { email, resetTicket, password } = request.data;
    if (!validEmail(email) || typeof resetTicket !== "string" || !validPassword(password))
        fail("Permintaan reset password tidak valid.");
    const verifiedEmail = email.toLowerCase().trim();
    const verifiedTicket = resetTicket;
    const verifiedPassword = password;
    const ref = db.collection("passwordResetTickets").doc(hash(verifiedTicket));
    await db.runTransaction(async (transaction) => { const snap = await transaction.get(ref); const data = snap.data(); if (!data || data.email !== verifiedEmail || data.consumedAt || data.expiresAt.toMillis() < Date.now())
        fail("Sesi reset password sudah tidak berlaku.", "failed-precondition"); transaction.update(ref, { consumedAt: firestore_1.FieldValue.serverTimestamp() }); });
    const user = await adminAuth.getUserByEmail(verifiedEmail);
    await adminAuth.updateUser(user.uid, { password: verifiedPassword });
    await adminAuth.revokeRefreshTokens(user.uid);
    return { success: true };
});
exports.createDemoToken = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const nickname = request.data?.nickname;
    if (typeof nickname !== "string" || nickname.trim().length < 2 || nickname.trim().length > 30)
        fail("Nama panggilan harus terdiri dari 2–30 karakter.");
    return { customToken: await adminAuth.createCustomToken("asetkita-demo", { demo: true, nickname: nickname.trim() }) };
});
const sim = (category, rows) => rows.map(([symbol, name, ath]) => ({ id: symbol.toLowerCase().replace(".", "-"), symbol, name, price: Math.round(ath * .8 * (category === "stock" && ["bbca", "bbri", "bmri", "tlkm", "asii", "bbni", "bren", "byan", "goto", "icbp", "antm", "klbf", "unvr", "untr", "pgas"].includes(symbol.toLowerCase()) ? 1 : 16000)), volatility: category === "crypto" ? .05 : category === "stock" ? .02 : .01 }));
const simulationAssets = [
    ...sim("crypto", [["BTC", "Bitcoin", 108900], ["ETH", "Ethereum", 4891], ["BNB", "BNB", 720], ["SOL", "Solana", 260], ["XRP", "XRP", 3.84], ["ADA", "Cardano", 3.1], ["DOGE", "Dogecoin", .73], ["DOT", "Polkadot", 55], ["LINK", "Chainlink", 52.88], ["AVAX", "Avalanche", 146.22], ["SHIB", "Shiba Inu", .00008845], ["TRX", "TRON", .43], ["LTC", "Litecoin", 412.96], ["BCH", "Bitcoin Cash", 4355], ["POL", "Polygon", 2.92]]),
    ...sim("stock", [["AAPL", "Apple Inc.", 310], ["MSFT", "Microsoft Corporation", 500], ["NVDA", "NVIDIA Corporation", 135], ["GOOGL", "Alphabet Inc.", 195], ["AMZN", "Amazon.com Inc.", 200], ["META", "Meta Platforms Inc.", 530], ["TSLA", "Tesla Inc.", 230], ["BRK.B", "Berkshire Hathaway Inc.", 450], ["LLY", "Eli Lilly", 850], ["AVGO", "Broadcom", 175], ["JPM", "JPMorgan", 220], ["WMT", "Walmart", 75], ["V", "Visa", 275], ["XOM", "Exxon Mobil", 120], ["DIS", "Disney", 100], ["BBCA", "Bank Central Asia", 6400], ["BBRI", "Bank Rakyat Indonesia", 3050], ["BMRI", "Bank Mandiri", 4250], ["TLKM", "Telkom Indonesia", 2700], ["ASII", "Astra International", 5150], ["BBNI", "Bank Negara Indonesia", 3650], ["BREN", "Barito Renewables", 3400], ["BYAN", "Bayan Resources", 12100], ["GOTO", "GoTo", 55], ["ICBP", "Indofood CBP", 7500], ["ANTM", "Aneka Tambang", 3100], ["KLBF", "Kalbe Farma", 810], ["UNVR", "Unilever Indonesia", 1850], ["UNTR", "United Tractors", 24000], ["PGAS", "Perusahaan Gas Negara", 1550]]),
    ...sim("metal", [["XRH", "Rhodium", 29800], ["XIR", "Iridium", 9080], ["XAU", "Gold", 5608], ["XPD", "Palladium", 3440], ["XPT", "Platinum", 2290], ["XOS", "Osmium", 1300], ["XRU", "Ruthenium", 870], ["RE", "Rhenium", 370], ["XAG", "Silver", 49.51], ["IN", "Indium", 32.6]])
];
const AI_AUTH_MESSAGE = "Fitur AI hanya tersedia untuk pengguna yang sudah masuk dengan akun AsetKita.";
const mustAuth = (request) => { if (!request.auth || request.auth.token.demo === true)
    throw new https_1.HttpsError("unauthenticated", AI_AUTH_MESSAGE); return request.auth.uid; };
exports.updateMarketSimulation = (0, scheduler_1.onSchedule)({ region: REGION, schedule: "every 4 hours", timeZone: "Asia/Jakarta" }, async () => {
    const batch = db.batch();
    const now = firestore_1.Timestamp.now();
    for (const asset of simulationAssets) {
        const ref = db.collection("marketPrices").doc(asset.id);
        const old = await ref.get();
        const previous = Number(old.data()?.price ?? asset.price);
        const next = Math.max(1, Math.round(previous * (1 + (Math.random() * 2 - 1) * asset.volatility) * 100) / 100);
        batch.set(ref, { ...asset, price: next, previousPrice: previous, changePercent: Number((((next - previous) / previous) * 100).toFixed(2)), updatedAt: now }, { merge: true });
        batch.set(ref.collection("history").doc(now.toMillis().toString()), { price: next, at: now, label: now.toDate().toLocaleDateString("id-ID") });
    }
    await batch.commit();
});
exports.executeTrade = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = mustAuth(request);
    const { assetId, side, quantity } = request.data;
    if (typeof assetId !== "string" || (side !== "buy" && side !== "sell") || typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0)
        fail("Data transaksi tidak valid.");
    const asset = simulationAssets.find((item) => item.id === assetId);
    if (!asset)
        throw new https_1.HttpsError("invalid-argument", "Aset tidak ditemukan.");
    const validQuantity = quantity;
    const portfolioId = `${uid}_utama`;
    const portfolio = db.collection("portfolios").doc(portfolioId);
    const wallet = db.collection("wallets").doc(uid);
    const holding = portfolio.collection("holdings").doc(asset.id);
    const transaction = db.collection("transactions").doc();
    await db.runTransaction(async (tx) => { const [priceSnap, walletSnap, holdingSnap] = await Promise.all([tx.get(db.collection("marketPrices").doc(asset.id)), tx.get(wallet), tx.get(holding)]); const price = Number(priceSnap.data()?.price); if (!Number.isFinite(price) || price <= 0)
        throw new https_1.HttpsError("failed-precondition", "Harga aset belum tersedia."); const total = price * validQuantity; const balance = Number(walletSnap.data()?.balance ?? 0); const oldQuantity = Number(holdingSnap.data()?.quantity ?? 0); if (side === "buy") {
        if (balance < total)
            throw new https_1.HttpsError("failed-precondition", "Saldo tidak mencukupi.");
        const averageBuy = ((Number(holdingSnap.data()?.averageBuy ?? 0) * oldQuantity) + total) / (oldQuantity + validQuantity);
        tx.set(wallet, { uid, balance: balance - total, updatedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
        tx.set(holding, { assetId: asset.id, symbol: asset.symbol, name: asset.name, quantity: oldQuantity + validQuantity, averageBuy, currentPrice: price, updatedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
    }
    else {
        if (oldQuantity < validQuantity)
            throw new https_1.HttpsError("failed-precondition", "Jumlah aset tidak mencukupi.");
        tx.set(wallet, { uid, balance: balance + total, updatedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
        if (oldQuantity === validQuantity)
            tx.delete(holding);
        else
            tx.update(holding, { quantity: oldQuantity - validQuantity, currentPrice: price, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    } tx.set(transaction, { uid, assetId: asset.id, symbol: asset.symbol, name: asset.name, side, quantity: validQuantity, price, total, status: "completed", createdAt: firestore_1.FieldValue.serverTimestamp() }); });
    return { success: true };
});
exports.toggleWatchlist = (0, https_1.onCall)({ region: REGION }, async (request) => { const uid = mustAuth(request); const assetId = request.data?.assetId; if (typeof assetId !== "string" || !simulationAssets.some((item) => item.id === assetId))
    fail("Aset tidak valid."); const ref = db.collection("watchlists").doc(uid); const result = await db.runTransaction(async (tx) => { const current = (await tx.get(ref)).data()?.assetIds; const assetIds = (current ?? []).includes(assetId) ? (current ?? []).filter((id) => id !== assetId) : [...(current ?? []), assetId]; tx.set(ref, { uid, assetIds, updatedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true }); return assetIds; }); return { assetIds: result }; });
exports.updateProfile = (0, https_1.onCall)({ region: REGION }, async (request) => { const uid = mustAuth(request); const { namaPanggilan, nomorHP } = request.data; if (!validName(namaPanggilan) || !validPhone(nomorHP))
    throw new https_1.HttpsError("invalid-argument", "Profil tidak valid."); const name = namaPanggilan.trim(); await db.collection("users").doc(uid).update({ namaPanggilan: name, nomorHP, updatedAt: firestore_1.FieldValue.serverTimestamp() }); await adminAuth.updateUser(uid, { displayName: name }); return { success: true }; });
exports.updateSettings = (0, https_1.onCall)({ region: REGION }, async (request) => { const uid = mustAuth(request); const keys = ["marketAlerts", "aiInsights", "systemNotifications", "emailDigest", "analytics", "personalizedRecommendations", "portfolioSharing"]; const data = request.data; if (!keys.every((key) => typeof data[key] === "boolean"))
    fail("Pengaturan tidak valid."); await db.collection("settings").doc(uid).set(Object.fromEntries(keys.map((key) => [key, data[key]])), { merge: true }); return { success: true }; });
exports.deleteAccount = (0, https_1.onCall)({ region: REGION }, async (request) => { const uid = mustAuth(request); const portfolio = db.collection("portfolios").doc(`${uid}_utama`); await Promise.all([db.recursiveDelete(portfolio), db.collection("users").doc(uid).delete(), db.collection("wallets").doc(uid).delete(), db.collection("watchlists").doc(uid).delete(), db.collection("settings").doc(uid).delete()]); const transactions = await db.collection("transactions").where("uid", "==", uid).get(); const batch = db.batch(); transactions.docs.forEach((row) => batch.delete(row.ref)); await batch.commit(); await adminAuth.deleteUser(uid); return { success: true }; });
const AI_MAX_MESSAGES = 20;
const AI_MAX_MESSAGE_LENGTH = 4000;
const isAIMessage = (value) => {
    if (typeof value !== "object" || value === null)
        return false;
    const message = value;
    return (message.role === "user" || message.role === "model") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= AI_MAX_MESSAGE_LENGTH;
};
const AI_SYSTEM_INSTRUCTION = `Kamu adalah "AsetKita AI Assistant", AI Investment Learning Assistant untuk AsetKita, platform edukasi dan simulasi investasi.
Gunakan Bahasa Indonesia secara default. Bersikap natural, jelas, ramah, profesional, dan mudah dipahami pemula.
Jelaskan saham, cryptocurrency, logam mulia, investasi, portofolio, transaksi, profit/loss, risiko, market, dan istilah finansial secara edukatif.
Gunakan bullet points, numbering, contoh sederhana, atau tabel sederhana jika membantu.
Jangan menjanjikan profit, mengatakan aset pasti naik atau turun, memberi jaminan, atau mendorong pembelian maupun penjualan aset tertentu.
Jika ditanya apakah harus membeli aset, jelaskan faktor pertimbangan seperti tujuan, kondisi keuangan, toleransi risiko, jangka waktu, dan diversifikasi tanpa memberi keputusan personal yang definitif.
Bedakan data simulasi AsetKita dari data pasar nyata. Jangan mengaku memiliki data real-time jika tidak diberikan dalam konteks dan jangan mengarang data pengguna.
Jika data portfolio atau saldo tidak ada di konteks, katakan bahwa data tersebut belum tersedia.
Jawaban harus generatif dan menjawab pertanyaan pengguna berdasarkan percakapan, bukan berdasarkan jawaban statis.`;
exports.chatWithAI = (0, https_1.onCall)({ region: REGION, secrets: [geminiApiKey] }, async (request) => {
    const uid = mustAuth(request);
    const payload = request.data;
    const message = payload?.message;
    const history = payload?.history;
    if (typeof message !== "string" || !message.trim() || message.length > AI_MAX_MESSAGE_LENGTH) {
        throw new https_1.HttpsError("invalid-argument", "Pertanyaan tidak valid.");
    }
    if (!Array.isArray(history) || history.length >= AI_MAX_MESSAGES || !history.every(isAIMessage)) {
        throw new https_1.HttpsError("invalid-argument", "Riwayat percakapan tidak valid.");
    }
    if (history.length > 0 && history[0].role !== "user") {
        throw new https_1.HttpsError("invalid-argument", "Riwayat percakapan tidak valid.");
    }
    const context = payload?.context;
    if (JSON.stringify(context ?? {}).length > 6000) {
        throw new https_1.HttpsError("invalid-argument", "Konteks AI terlalu panjang.");
    }
    let apiKey = "";
    try {
        apiKey = geminiApiKey.value();
    }
    catch {
        throw new https_1.HttpsError("failed-precondition", "Konfigurasi Gemini belum siap.");
    }
    if (!apiKey)
        throw new https_1.HttpsError("failed-precondition", "Konfigurasi Gemini belum siap.");
    const contextInstruction = [
        context?.page ? `Halaman: ${String(context.page)}` : "",
        context?.section ? `Bagian: ${String(context.section)}` : "",
        context?.userName ? `Nama pengguna: ${String(context.userName)}` : "",
        context?.asset ? `Data aset simulasi AsetKita: ${JSON.stringify(context.asset)}` : "",
    ].filter(Boolean).join("\n");
    const contents = [
        ...history.map((item) => ({ role: item.role, parts: [{ text: item.content }] })),
        { role: "user", parts: [{ text: contextInstruction ? `${contextInstruction}\n\nPertanyaan pengguna: ${message}` : message }] },
    ];
    console.info("AI request started", { uid, model: geminiModel.value(), messageCount: contents.length });
    try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: geminiModel.value(),
            contents,
            config: {
                systemInstruction: AI_SYSTEM_INSTRUCTION,
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        });
        const text = response.text?.trim();
        if (!text)
            throw new Error("empty_response");
        console.info("AI request completed", { uid, model: geminiModel.value(), status: "success" });
        return { success: true, message: text, model: geminiModel.value() };
    }
    catch (error) {
        const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
        const category = status === 401 || status === 403 ? "configuration" : status === 429 ? "quota" : "provider";
        console.error("AI request failed", { uid, model: geminiModel.value(), category });
        if (status === 401 || status === 403)
            throw new https_1.HttpsError("failed-precondition", "Konfigurasi Gemini belum siap.");
        if (status === 429)
            throw new https_1.HttpsError("resource-exhausted", "AI sedang menerima banyak permintaan.");
        throw new https_1.HttpsError("internal", "Layanan AI sedang mengalami gangguan.");
    }
});
