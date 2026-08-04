import { createHash, randomBytes, randomInt } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
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
    await db.collection("users").doc(user.uid).set({ uid: user.uid, namaLengkap: verifiedName.trim(), namaPanggilan: verifiedNickname.trim(), email: normalizedEmail, nomorHP: verifiedPhone, photoURL, role: "investor", status: "aktif", emailVerified: true, createdAt: now, updatedAt: now, lastLogin: now, provider: "password" });
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
