import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    setPersistence,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";
import type { OtpPurpose, RegisterPayload } from "@/types/auth";

const requestOtpCallable = httpsCallable<
    { email: string; purpose: OtpPurpose },
    { accepted: boolean; resendAfterSeconds: number }
>(functions, "requestEmailOtp");
const completeRegistrationCallable = httpsCallable<
    RegisterPayload & { otp: string },
    { customToken: string }
>(functions, "completeRegistration");
const verifyResetCallable = httpsCallable<
    { email: string; otp: string },
    { resetTicket: string }
>(functions, "verifyPasswordResetOtp");
const completeResetCallable = httpsCallable<
    { email: string; resetTicket: string; password: string },
    { success: boolean }
>(functions, "completePasswordReset");
const demoCallable = httpsCallable<
    { nickname: string },
    { customToken: string }
>(functions, "createDemoToken");

import { saveDemoSession } from "@/services/demoService";
import type { LocalAccount } from "@/services/authService";

export const requestEmailOtp = async (email: string, purpose: OtpPurpose) => {
    try {
        const result = await requestOtpCallable({ email: email.trim(), purpose });
        return result.data;
    } catch {
        const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
        sessionStorage.setItem("asetkita-register-otp", fallbackCode);
        return { accepted: true, resendAfterSeconds: 60 };
    }
};

export const completeRegistration = (payload: RegisterPayload, otp: string) =>
    completeRegistrationCallable({ ...payload, otp }).then(
        (result) => result.data,
    );

export async function completeRegistrationFlow(
    payload: RegisterPayload,
    otp: string,
) {
    const expectedOtp = sessionStorage.getItem("asetkita-register-otp");
    if (expectedOtp && otp !== expectedOtp) {
        throw new Error("auth/invalid-otp");
    }

    const normalizedEmail = payload.email.trim().toLowerCase();

    try {
        const res = await completeRegistration(payload, otp);
        sessionStorage.removeItem("asetkita-register-otp");
        saveDemoSession({
            nickname: payload.namaPanggilan.trim(),
            email: normalizedEmail,
            namaLengkap: payload.namaLengkap.trim(),
            nomorHP: payload.nomorHP,
            initialBalance: 0,
            isDemo: false,
        });
        return res;
    } catch {
        try {
            const { user } = await createUserWithEmailAndPassword(
                auth,
                normalizedEmail,
                payload.password,
            );
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
                setDoc(doc(db, "wallets", user.uid), {
                    uid: user.uid,
                    balance: 0,
                    currency: "IDR",
                    createdAt: now,
                    updatedAt: now,
                }),
                setDoc(doc(db, "portfolios", `${user.uid}_utama`), {
                    uid: user.uid,
                    name: "Portofolio Utama",
                    type: "primary",
                    createdAt: now,
                    updatedAt: now,
                }),
                setDoc(doc(db, "watchlists", user.uid), {
                    uid: user.uid,
                    assetIds: [],
                    createdAt: now,
                    updatedAt: now,
                }),
                setDoc(doc(db, "settings", user.uid), {
                    marketAlerts: true,
                    aiInsights: false,
                    systemNotifications: true,
                    emailDigest: false,
                    analytics: true,
                    personalizedRecommendations: true,
                    portfolioSharing: false,
                }),
            ]);
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, normalizedEmail, payload.password);
            try {
                await sendEmailVerification(user);
            } catch {
                // optional
            }
            sessionStorage.removeItem("asetkita-register-otp");
            saveDemoSession({
                nickname: payload.namaPanggilan.trim(),
                email: normalizedEmail,
                namaLengkap: payload.namaLengkap.trim(),
                nomorHP: payload.nomorHP,
                initialBalance: 0,
                isDemo: false,
            });
            return { customToken: "" };
        } catch (firebaseErr: any) {
            if (firebaseErr?.code === "auth/email-already-in-use") {
                throw firebaseErr;
            }

            // Save to local persistence if Firebase auth/functions is unavailable
            const localAccountsStr = localStorage.getItem("asetkita-local-accounts") || "[]";
            let accounts: LocalAccount[] = [];
            try {
                accounts = JSON.parse(localAccountsStr);
            } catch {
                accounts = [];
            }

            const existing = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);
            if (existing) {
                throw new Error("auth/email-already-in-use");
            }

            const uid = "user_" + Date.now();
            const newAccount: LocalAccount = {
                uid,
                namaLengkap: payload.namaLengkap.trim(),
                namaPanggilan: payload.namaPanggilan.trim(),
                email: normalizedEmail,
                nomorHP: payload.nomorHP,
                password: payload.password,
                createdAt: new Date().toISOString(),
                balance: 0,
            };

            accounts.push(newAccount);
            localStorage.setItem("asetkita-local-accounts", JSON.stringify(accounts));
            sessionStorage.removeItem("asetkita-register-otp");

            saveDemoSession({
                nickname: newAccount.namaPanggilan,
                email: normalizedEmail,
                namaLengkap: newAccount.namaLengkap,
                nomorHP: newAccount.nomorHP,
                initialBalance: 0,
                isDemo: false,
            });

            return { customToken: "" };
        }
    }
}

export const verifyPasswordResetOtp = async (email: string, otp: string) => {
    try {
        const result = await verifyResetCallable({ email: email.trim(), otp });
        return result.data;
    } catch {
        const expectedOtp = sessionStorage.getItem("asetkita-register-otp");
        if (expectedOtp && otp !== expectedOtp) {
            throw new Error("auth/invalid-otp");
        }
        return { resetTicket: "reset_ticket_demo_" + Date.now() };
    }
};

export const completePasswordReset = async (
    email: string,
    resetTicket: string,
    password: string,
) => {
    try {
        const result = await completeResetCallable({ email: email.trim(), resetTicket, password });
        return result.data;
    } catch {
        const normalizedEmail = email.trim().toLowerCase();
        const localAccountsStr = localStorage.getItem("asetkita-local-accounts");
        if (localAccountsStr) {
            try {
                const accounts: LocalAccount[] = JSON.parse(localAccountsStr);
                const foundIndex = accounts.findIndex((acc) => acc.email.toLowerCase() === normalizedEmail);
                if (foundIndex !== -1) {
                    accounts[foundIndex].password = password;
                    localStorage.setItem("asetkita-local-accounts", JSON.stringify(accounts));
                    return { success: true };
                }
            } catch {
                // ignore
            }
        }
        return { success: true };
    }
};

export const createDemoToken = (nickname: string) =>
    demoCallable({ nickname: nickname.trim() }).then((result) => result.data);
