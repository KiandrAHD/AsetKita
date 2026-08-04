"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDemoToken = exports.completePasswordReset = exports.verifyPasswordResetOtp = exports.completeRegistration = exports.requestEmailOtp = void 0;
const node_crypto_1 = require("node:crypto");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const resend_1 = require("resend");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const adminAuth = (0, auth_1.getAuth)();
const resendKey = (0, params_1.defineSecret)("RESEND_API_KEY");
const otpFromEmail = (0, params_1.defineSecret)("OTP_FROM_EMAIL");
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
    await db.collection("users").doc(user.uid).set({ uid: user.uid, namaLengkap: verifiedName.trim(), namaPanggilan: verifiedNickname.trim(), email: normalizedEmail, nomorHP: verifiedPhone, photoURL, role: "investor", status: "aktif", emailVerified: true, createdAt: now, updatedAt: now, lastLogin: now, provider: "password" });
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
