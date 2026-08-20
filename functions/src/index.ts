import { createHash, randomBytes, randomInt } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Resend } from "resend";

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();
const resendKey = defineSecret("RESEND_API_KEY");
const otpFromEmail = defineSecret("OTP_FROM_EMAIL");
const REGION = "asia-southeast2";
const TTL_MINUTES = 10;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;
type Purpose = "register" | "reset-password";
type OtpDocument = { email: string; purpose: Purpose; codeHash: string; expiresAt: Timestamp; resendAfter: Timestamp; attempts: number; consumedAt?: Timestamp };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const otpId = (email: string, purpose: Purpose) => hash(`${purpose}:${email.toLowerCase()}`);
const otpRef = (email: string, purpose: Purpose) => db.collection("emailOtps").doc(otpId(email, purpose));
const validEmail = (value: unknown): value is string => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (value: unknown): value is string => typeof value === "string" && value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const validPhone = (value: unknown): value is string => typeof value === "string" && /^\+62(?:8\d{8,12})$/.test(value);
const validName = (value: unknown): value is string => typeof value === "string" && value.trim().length >= 2;
const fail = (message: string, code: "invalid-argument" | "failed-precondition" | "permission-denied" | "resource-exhausted" = "invalid-argument"): never => { throw new HttpsError(code, message); };

async function consumeOtp(email: string, purpose: Purpose, code: string) {
    if (!/^\d{6}$/.test(code)) fail("Kode verifikasi harus terdiri dari 6 angka.");
    const ref = otpRef(email, purpose);
    await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        const data = snap.data() as OtpDocument | undefined;
        if (!data || data.consumedAt || data.expiresAt.toMillis() < Date.now()) fail("Kode verifikasi tidak valid atau telah kedaluwarsa.", "failed-precondition");
        const activeOtp = data as OtpDocument;
        if (activeOtp.attempts >= MAX_ATTEMPTS) fail("Terlalu banyak percobaan. Minta kode baru untuk melanjutkan.", "resource-exhausted");
        if (activeOtp.codeHash !== hash(code)) { transaction.update(ref, { attempts: FieldValue.increment(1) }); fail("Kode verifikasi tidak tepat.", "permission-denied"); }
        transaction.update(ref, { consumedAt: FieldValue.serverTimestamp() });
    });
}

export const requestEmailOtp = onCall({ region: REGION, secrets: [resendKey, otpFromEmail] }, async (request) => {
    const { email, purpose } = request.data as { email?: unknown; purpose?: unknown };
    if (!validEmail(email) || (purpose !== "register" && purpose !== "reset-password")) fail("Permintaan verifikasi tidak valid.");
    const normalizedEmail = (email as string).toLowerCase().trim();
    const verifiedPurpose = purpose as Purpose;
    const existing = await adminAuth.getUserByEmail(normalizedEmail).then(() => true).catch(() => false);
    if ((verifiedPurpose === "register" && existing) || (verifiedPurpose === "reset-password" && !existing)) return { accepted: true, resendAfterSeconds: RESEND_SECONDS };
    const ref = otpRef(normalizedEmail, verifiedPurpose);
    const current = await ref.get();
    const resendAfter = current.data()?.resendAfter as Timestamp | undefined;
    if (resendAfter && resendAfter.toMillis() > Date.now()) fail("Mohon tunggu sebelum meminta kode baru.", "resource-exhausted");
    const code = String(randomInt(100000, 1_000_000));
    await ref.set({ email: normalizedEmail, purpose: verifiedPurpose, codeHash: hash(code), expiresAt: Timestamp.fromMillis(Date.now() + TTL_MINUTES * 60_000), resendAfter: Timestamp.fromMillis(Date.now() + RESEND_SECONDS * 1000), attempts: 0, consumedAt: null, updatedAt: FieldValue.serverTimestamp() });
    const subject = verifiedPurpose === "register" ? "Kode verifikasi akun AsetKita" : "Kode pemulihan password AsetKita";
    await new Resend(resendKey.value()).emails.send({ from: otpFromEmail.value(), to: normalizedEmail, subject, html: `<p>Gunakan kode berikut untuk melanjutkan:</p><h1 style="letter-spacing:6px">${code}</h1><p>Kode berlaku selama ${TTL_MINUTES} menit. Jangan bagikan kode ini kepada siapa pun.</p>` });
    return { accepted: true, resendAfterSeconds: RESEND_SECONDS };
});

export const completeRegistration = onCall({ region: REGION }, async (request) => {
    const { namaLengkap, namaPanggilan, email, nomorHP, password, otp } = request.data as Record<string, unknown>;
    if (!validName(namaLengkap) || !validName(namaPanggilan) || !validEmail(email) || !validPhone(nomorHP) || !validPassword(password) || typeof otp !== "string") fail("Data pendaftaran tidak valid.");
    const normalizedEmail = (email as string).toLowerCase().trim();
    const verifiedPassword = password as string; const verifiedOtp = otp as string; const verifiedName = namaLengkap as string; const verifiedNickname = namaPanggilan as string; const verifiedPhone = nomorHP as string;
    await consumeOtp(normalizedEmail, "register", verifiedOtp);
    let user;
    try { user = await adminAuth.createUser({ email: normalizedEmail, password: verifiedPassword, displayName: verifiedNickname.trim(), emailVerified: true }); } catch (error) { if (typeof error === "object" && error && "code" in error && String(error.code).includes("email-already-exists")) fail("Email ini sudah terdaftar.", "failed-precondition"); throw error; }
    const now = FieldValue.serverTimestamp();
    const photoURL = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(verifiedNickname.trim())}&backgroundColor=0b1220&fontFamily=Arial`;
    const portfolioId = `${user.uid}_utama`;
    const batch = db.batch(); batch.set(db.collection("users").doc(user.uid), { uid: user.uid, namaLengkap: verifiedName.trim(), namaPanggilan: verifiedNickname.trim(), email: normalizedEmail, nomorHP: verifiedPhone, photoURL, role: "investor", status: "aktif", emailVerified: true, financialScore: 0, primaryPortfolioId: portfolioId, createdAt: now, updatedAt: now, lastLogin: now, provider: "password" }); batch.set(db.collection("wallets").doc(user.uid), { uid: user.uid, balance: 0, currency: "IDR", updatedAt: now, createdAt: now }); batch.set(db.collection("portfolios").doc(portfolioId), { uid: user.uid, name: "Portofolio Utama", type: "primary", createdAt: now, updatedAt: now }); await batch.commit();
    return { customToken: await adminAuth.createCustomToken(user.uid) };
});

export const verifyPasswordResetOtp = onCall({ region: REGION }, async (request) => {
    const { email, otp } = request.data as { email?: unknown; otp?: unknown };
    if (!validEmail(email) || typeof otp !== "string") fail("Permintaan verifikasi tidak valid.");
    const normalizedEmail = (email as string).toLowerCase().trim();
    await consumeOtp(normalizedEmail, "reset-password", otp as string);
    const ticket = randomBytes(32).toString("hex");
    await db.collection("passwordResetTickets").doc(hash(ticket)).set({ email: normalizedEmail, expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60_000), consumedAt: null, createdAt: FieldValue.serverTimestamp() });
    return { resetTicket: ticket };
});

export const completePasswordReset = onCall({ region: REGION }, async (request) => {
    const { email, resetTicket, password } = request.data as { email?: unknown; resetTicket?: unknown; password?: unknown };
    if (!validEmail(email) || typeof resetTicket !== "string" || !validPassword(password)) fail("Permintaan reset password tidak valid.");
    const verifiedEmail = (email as string).toLowerCase().trim(); const verifiedTicket = resetTicket as string; const verifiedPassword = password as string;
    const ref = db.collection("passwordResetTickets").doc(hash(verifiedTicket));
    await db.runTransaction(async (transaction) => { const snap = await transaction.get(ref); const data = snap.data(); if (!data || data.email !== verifiedEmail || data.consumedAt || data.expiresAt.toMillis() < Date.now()) fail("Sesi reset password sudah tidak berlaku.", "failed-precondition"); transaction.update(ref, { consumedAt: FieldValue.serverTimestamp() }); });
    const user = await adminAuth.getUserByEmail(verifiedEmail);
    await adminAuth.updateUser(user.uid, { password: verifiedPassword });
    await adminAuth.revokeRefreshTokens(user.uid);
    return { success: true };
});

export const createDemoToken = onCall({ region: REGION }, async (request) => {
    const nickname = request.data?.nickname;
    if (typeof nickname !== "string" || nickname.trim().length < 2 || nickname.trim().length > 30) fail("Nama panggilan harus terdiri dari 2–30 karakter.");
    return { customToken: await adminAuth.createCustomToken("asetkita-demo", { demo: true, nickname: nickname.trim() }) };
});


type SimAsset = { id: string; symbol: string; name: string; price: number; volatility: number };
const sim = (category: "crypto" | "stock" | "metal", rows: Array<[string, string, number]>) => rows.map(([symbol, name, ath]) => ({ id: symbol.toLowerCase().replace(".", "-"), symbol, name, price: Math.round(ath * .8 * (category === "stock" && ["bbca","bbri","bmri","tlkm","asii","bbni","bren","byan","goto","icbp","antm","klbf","unvr","untr","pgas"].includes(symbol.toLowerCase()) ? 1 : 16000)), volatility: category === "crypto" ? .05 : category === "stock" ? .02 : .01 }));
const simulationAssets: SimAsset[] = [
  ...sim("crypto", [["BTC","Bitcoin",108900],["ETH","Ethereum",4891],["BNB","BNB",720],["SOL","Solana",260],["XRP","XRP",3.84],["ADA","Cardano",3.1],["DOGE","Dogecoin",.73],["DOT","Polkadot",55],["LINK","Chainlink",52.88],["AVAX","Avalanche",146.22],["SHIB","Shiba Inu",.00008845],["TRX","TRON",.43],["LTC","Litecoin",412.96],["BCH","Bitcoin Cash",4355],["POL","Polygon",2.92]]),
  ...sim("stock", [["AAPL","Apple Inc.",310],["MSFT","Microsoft Corporation",500],["NVDA","NVIDIA Corporation",135],["GOOGL","Alphabet Inc.",195],["AMZN","Amazon.com Inc.",200],["META","Meta Platforms Inc.",530],["TSLA","Tesla Inc.",230],["BRK.B","Berkshire Hathaway Inc.",450],["LLY","Eli Lilly",850],["AVGO","Broadcom",175],["JPM","JPMorgan",220],["WMT","Walmart",75],["V","Visa",275],["XOM","Exxon Mobil",120],["DIS","Disney",100],["BBCA","Bank Central Asia",6400],["BBRI","Bank Rakyat Indonesia",3050],["BMRI","Bank Mandiri",4250],["TLKM","Telkom Indonesia",2700],["ASII","Astra International",5150],["BBNI","Bank Negara Indonesia",3650],["BREN","Barito Renewables",3400],["BYAN","Bayan Resources",12100],["GOTO","GoTo",55],["ICBP","Indofood CBP",7500],["ANTM","Aneka Tambang",3100],["KLBF","Kalbe Farma",810],["UNVR","Unilever Indonesia",1850],["UNTR","United Tractors",24000],["PGAS","Perusahaan Gas Negara",1550]]),
  ...sim("metal", [["XRH","Rhodium",29800],["XIR","Iridium",9080],["XAU","Gold",5608],["XPD","Palladium",3440],["XPT","Platinum",2290],["XOS","Osmium",1300],["XRU","Ruthenium",870],["RE","Rhenium",370],["XAG","Silver",49.51],["IN","Indium",32.6]])
];
const AI_AUTH_MESSAGE = "Fitur AI hanya tersedia untuk pengguna yang sudah masuk dengan akun AsetKita.";
const mustAuth = (request: { auth?: { uid: string; token: Record<string, unknown> } }) => { if (!request.auth || request.auth.token.demo === true) throw new HttpsError("unauthenticated", AI_AUTH_MESSAGE); return request.auth.uid; };

export const updateMarketSimulation = onSchedule({ region: REGION, schedule: "every 4 hours", timeZone: "Asia/Jakarta" }, async () => {
  const batch = db.batch(); const now = Timestamp.now();
  for (const asset of simulationAssets) { const ref = db.collection("marketPrices").doc(asset.id); const old = await ref.get(); const previous = Number(old.data()?.price ?? asset.price); const next = Math.max(1, Math.round(previous * (1 + (Math.random() * 2 - 1) * asset.volatility) * 100) / 100); batch.set(ref, { ...asset, price: next, previousPrice: previous, changePercent: Number((((next - previous) / previous) * 100).toFixed(2)), updatedAt: now }, { merge: true }); batch.set(ref.collection("history").doc(now.toMillis().toString()), { price: next, at: now, label: now.toDate().toLocaleDateString("id-ID") }); }
  await batch.commit();
});

export const executeTrade = onCall({ region: REGION }, async (request) => {
  const uid = mustAuth(request); const { assetId, side, quantity } = request.data as { assetId?: unknown; side?: unknown; quantity?: unknown };
  if (typeof assetId !== "string" || (side !== "buy" && side !== "sell") || typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) fail("Data transaksi tidak valid.");
  const asset = simulationAssets.find((item) => item.id === assetId); if (!asset) throw new HttpsError("invalid-argument", "Aset tidak ditemukan."); const validQuantity = quantity as number;
  const portfolioId = `${uid}_utama`; const portfolio = db.collection("portfolios").doc(portfolioId); const wallet = db.collection("wallets").doc(uid); const holding = portfolio.collection("holdings").doc(asset.id); const transaction = db.collection("transactions").doc();
  await db.runTransaction(async (tx) => { const [priceSnap, walletSnap, holdingSnap] = await Promise.all([tx.get(db.collection("marketPrices").doc(asset.id)), tx.get(wallet), tx.get(holding)]); const price = Number(priceSnap.data()?.price); if (!Number.isFinite(price) || price <= 0) throw new HttpsError("failed-precondition", "Harga aset belum tersedia."); const total = price * validQuantity; const balance = Number(walletSnap.data()?.balance ?? 0); const oldQuantity = Number(holdingSnap.data()?.quantity ?? 0); if (side === "buy") { if (balance < total) throw new HttpsError("failed-precondition", "Saldo tidak mencukupi."); const averageBuy = ((Number(holdingSnap.data()?.averageBuy ?? 0) * oldQuantity) + total) / (oldQuantity + validQuantity); tx.set(wallet, { uid, balance: balance - total, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); tx.set(holding, { assetId: asset.id, symbol: asset.symbol, name: asset.name, quantity: oldQuantity + validQuantity, averageBuy, currentPrice: price, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); } else { if (oldQuantity < validQuantity) throw new HttpsError("failed-precondition", "Jumlah aset tidak mencukupi."); tx.set(wallet, { uid, balance: balance + total, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); if (oldQuantity === validQuantity) tx.delete(holding); else tx.update(holding, { quantity: oldQuantity - validQuantity, currentPrice: price, updatedAt: FieldValue.serverTimestamp() }); } tx.set(transaction, { uid, assetId: asset.id, symbol: asset.symbol, name: asset.name, side, quantity: validQuantity, price, total, status: "completed", createdAt: FieldValue.serverTimestamp() }); });
  return { success: true };
});

export const toggleWatchlist = onCall({ region: REGION }, async (request) => { const uid = mustAuth(request); const assetId = request.data?.assetId; if (typeof assetId !== "string" || !simulationAssets.some((item) => item.id === assetId)) fail("Aset tidak valid."); const ref = db.collection("watchlists").doc(uid); const result = await db.runTransaction(async (tx) => { const current = (await tx.get(ref)).data()?.assetIds as string[] | undefined; const assetIds = (current ?? []).includes(assetId) ? (current ?? []).filter((id) => id !== assetId) : [...(current ?? []), assetId]; tx.set(ref, { uid, assetIds, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); return assetIds; }); return { assetIds: result }; });
export const updateProfile = onCall({ region: REGION }, async (request) => { const uid = mustAuth(request); const { namaPanggilan, nomorHP } = request.data as { namaPanggilan?: unknown; nomorHP?: unknown }; if (!validName(namaPanggilan) || !validPhone(nomorHP)) throw new HttpsError("invalid-argument", "Profil tidak valid."); const name = namaPanggilan.trim(); await db.collection("users").doc(uid).update({ namaPanggilan: name, nomorHP, updatedAt: FieldValue.serverTimestamp() }); await adminAuth.updateUser(uid, { displayName: name }); return { success: true }; });
export const updateSettings = onCall({ region: REGION }, async (request) => { const uid = mustAuth(request); const keys = ["marketAlerts", "aiInsights", "systemNotifications", "emailDigest", "analytics", "personalizedRecommendations", "portfolioSharing"]; const data = request.data as Record<string, unknown>; if (!keys.every((key) => typeof data[key] === "boolean")) fail("Pengaturan tidak valid."); await db.collection("settings").doc(uid).set(Object.fromEntries(keys.map((key) => [key, data[key]])), { merge: true }); return { success: true }; });
export const deleteAccount = onCall({ region: REGION }, async (request) => { const uid = mustAuth(request); const portfolio = db.collection("portfolios").doc(`${uid}_utama`); await Promise.all([db.recursiveDelete(portfolio), db.collection("users").doc(uid).delete(), db.collection("wallets").doc(uid).delete(), db.collection("watchlists").doc(uid).delete(), db.collection("settings").doc(uid).delete()]); const transactions = await db.collection("transactions").where("uid", "==", uid).get(); const batch = db.batch(); transactions.docs.forEach((row) => batch.delete(row.ref)); await batch.commit(); await adminAuth.deleteUser(uid); return { success: true }; });

