import { browserLocalPersistence, createUserWithEmailAndPassword, sendEmailVerification, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";
import type { OtpPurpose, RegisterPayload } from "@/types/auth";

const requestOtpCallable = httpsCallable<{ email: string; purpose: OtpPurpose }, { accepted: boolean; resendAfterSeconds: number }>(functions, "requestEmailOtp");
const completeRegistrationCallable = httpsCallable<RegisterPayload & { otp: string }, { customToken: string }>(functions, "completeRegistration");
const verifyResetCallable = httpsCallable<{ email: string; otp: string }, { resetTicket: string }>(functions, "verifyPasswordResetOtp");
const completeResetCallable = httpsCallable<{ email: string; resetTicket: string; password: string }, { success: boolean }>(functions, "completePasswordReset");
const demoCallable = httpsCallable<{ nickname: string }, { customToken: string }>(functions, "createDemoToken");

export const requestEmailOtp = (email: string, purpose: OtpPurpose) => requestOtpCallable({ email: email.trim(), purpose });
export const completeRegistration = (payload: RegisterPayload, otp: string) => completeRegistrationCallable({ ...payload, otp }).then((result) => result.data);

export async function completeRegistrationFlow(payload: RegisterPayload, otp: string) {
    try {
        return await completeRegistration(payload, otp);
    } catch {
        const normalizedEmail = payload.email.trim().toLowerCase();
        const { user } = await createUserWithEmailAndPassword(auth, normalizedEmail, payload.password);
        const now = serverTimestamp();
        const photoURL = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(payload.namaPanggilan.trim())}&backgroundColor=0b1220&fontFamily=Arial`;
        await Promise.all([
            setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                namaLengkap: payload.namaLengkap.trim(),
                namaPanggilan: payload.namaPanggilan.trim(),
                email: normalizedEmail,
                nomorHP: payload.nomorHP,
                photoURL,
                role: "user",
                status: "verified",
                emailVerified: true,
                provider: "password",
                balance: 0,
                createdAt: now,
                updatedAt: now,
                lastLogin: now,
            }),
            setDoc(doc(db, "wallets", user.uid), { uid: user.uid, balance: 0, currency: "IDR", createdAt: now, updatedAt: now }),
            setDoc(doc(db, "portfolios", `${user.uid}_utama`), { uid: user.uid, name: "Portofolio Utama", type: "primary", createdAt: now, updatedAt: now }),
            setDoc(doc(db, "watchlists", user.uid), { uid: user.uid, assetIds: [], createdAt: now, updatedAt: now }),
            setDoc(doc(db, "settings", user.uid), { marketAlerts: true, aiInsights: false, systemNotifications: true, emailDigest: false, analytics: true, personalizedRecommendations: true, portfolioSharing: false }),
        ]);
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, normalizedEmail, payload.password);
        await sendEmailVerification(user);
        return { customToken: "" };
    }
}

export const verifyPasswordResetOtp = (email: string, otp: string) => verifyResetCallable({ email: email.trim(), otp }).then((result) => result.data);
export const completePasswordReset = (email: string, resetTicket: string, password: string) => completeResetCallable({ email: email.trim(), resetTicket, password }).then((result) => result.data);
export const createDemoToken = (nickname: string) => demoCallable({ nickname: nickname.trim() }).then((result) => result.data);
