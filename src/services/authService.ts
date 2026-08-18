import {
    browserLocalPersistence,
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    setPersistence,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const TESTER_EMAIL = "tester@gmail.com";
const TESTER_PASSWORD = "Tester123!";

import { saveDemoSession } from "@/services/demoService";

export interface LocalAccount {
    uid: string;
    namaLengkap: string;
    namaPanggilan: string;
    email: string;
    nomorHP: string;
    password: string;
    createdAt: string;
    balance: number;
}

import { getUserCloudBalance } from "@/services/walletService";

export async function signIn(
    email: string,
    password: string,
    remember: boolean,
) {
    const normalizedEmail = email.trim().toLowerCase();
    try {
        await setPersistence(
            auth,
            remember ? browserLocalPersistence : browserSessionPersistence,
        );
        const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const cloudBalance = await getUserCloudBalance(cred.user.uid, normalizedEmail);
        saveDemoSession({
            nickname: cred.user.displayName || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            initialBalance: cloudBalance,
            balance: cloudBalance,
            isDemo: false,
        });
        return cred;
    } catch (firebaseErr: any) {
        // Fallback: check local stored accounts & auto-migrate to Cloud Firebase
        const localAccountsStr = localStorage.getItem("asetkita-local-accounts");
        if (localAccountsStr) {
            try {
                const accounts: LocalAccount[] = JSON.parse(localAccountsStr);
                const found = accounts.find(
                    (acc) => acc.email.toLowerCase() === normalizedEmail && acc.password === password
                );
                if (found) {
                    let cloudUid = found.uid;
                    let cloudBalance = found.balance ?? 10000000;

                    // Automatically register / migrate local account to Firebase Auth & Firestore Cloud
                    try {
                        const { user } = await createUserWithEmailAndPassword(
                            auth,
                            normalizedEmail,
                            password
                        );
                        cloudUid = user.uid;
                        const now = serverTimestamp();
                        await Promise.all([
                            setDoc(doc(db, "users", user.uid), {
                                uid: user.uid,
                                namaLengkap: found.namaLengkap || found.namaPanggilan,
                                namaPanggilan: found.namaPanggilan || "Investor",
                                email: normalizedEmail,
                                nomorHP: found.nomorHP || "",
                                balance: cloudBalance,
                                createdAt: now,
                                updatedAt: now,
                            }),
                            setDoc(doc(db, "wallets", user.uid), {
                                uid: user.uid,
                                balance: cloudBalance,
                                currency: "IDR",
                                createdAt: now,
                                updatedAt: now,
                            }),
                        ]);
                    } catch (migrationErr: any) {
                        if (migrationErr?.code === "auth/email-already-in-use") {
                            try {
                                const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
                                cloudUid = cred.user.uid;
                                const walletSnap = await getDoc(doc(db, "wallets", cloudUid));
                                if (walletSnap.exists() && typeof walletSnap.data()?.balance === "number") {
                                    cloudBalance = Number(walletSnap.data().balance);
                                }
                            } catch {
                                // ignore
                            }
                        }
                    }

                    saveDemoSession({
                        nickname: found.namaPanggilan || found.namaLengkap,
                        email: found.email,
                        namaLengkap: found.namaLengkap,
                        nomorHP: found.nomorHP,
                        initialBalance: cloudBalance,
                        balance: cloudBalance,
                        isDemo: false,
                    });
                    return { user: { uid: cloudUid, email: found.email } };
                }
            } catch {
                // Ignore parse error
            }
        }
        throw firebaseErr;
    }
}

export async function signInDemo(customToken: string) {
    return signInWithCustomToken(auth, customToken);
}

export const logout = () => signOut(auth);

async function seedTesterProfile(uid: string) {
    const now = serverTimestamp();
    const profile = {
        uid,
        namaLengkap: "Tester",
        namaPanggilan: "tester",
        email: TESTER_EMAIL,
        nomorHP: "+628111000000",
        role: "user",
        status: "verified",
        photoURL: `https://api.dicebear.com/9.x/initials/svg?seed=Tester&backgroundColor=0b1220&fontFamily=Arial`,
        emailVerified: true,
        provider: "password",
        balance: 0,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
    };

    await Promise.all([
        setDoc(doc(db, "users", uid), profile),
        setDoc(doc(db, "wallets", uid), {
            uid,
            balance: 0,
            currency: "IDR",
            createdAt: now,
            updatedAt: now,
        }),
        setDoc(doc(db, "portfolios", `${uid}_utama`), {
            uid,
            name: "Portofolio Utama",
            type: "primary",
            createdAt: now,
            updatedAt: now,
        }),
        setDoc(doc(db, "watchlists", uid), {
            uid,
            assetIds: [],
            createdAt: now,
            updatedAt: now,
        }),
        setDoc(doc(db, "settings", uid), {
            marketAlerts: true,
            aiInsights: false,
            systemNotifications: true,
            emailDigest: false,
            analytics: true,
            personalizedRecommendations: true,
            portfolioSharing: false,
        }),
    ]);
}

export async function ensureTesterAccount() {
    if (auth.currentUser?.email === TESTER_EMAIL) return;

    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, TESTER_EMAIL, TESTER_PASSWORD);
    } catch (error) {
        const code =
            typeof error === "object" && error && "code" in error
                ? String(error.code)
                : "";
        if (code !== "auth/user-not-found") throw error;

        const { user } = await createUserWithEmailAndPassword(
            auth,
            TESTER_EMAIL,
            TESTER_PASSWORD,
        );
        await seedTesterProfile(user.uid);
        await sendEmailVerification(user);
    }
}

export function getAuthErrorMessage(error: unknown) {
    if (typeof error === "string") return error;
    if (error instanceof Error) {
        if (error.message === "auth/invalid-otp")
            return "Kode verifikasi tidak sesuai. Silakan cek kembali input Anda.";
        if (error.message === "auth/email-already-in-use")
            return "Email ini sudah terdaftar. Silakan gunakan akun lain atau masuk ke akun yang sudah ada.";
        if (error.message && !error.message.startsWith("Firebase:"))
            return error.message;
    }
    const code =
        typeof error === "object" && error && "code" in error
            ? String(error.code)
            : "";
    if (
        [
            "auth/invalid-credential",
            "auth/wrong-password",
            "auth/user-not-found",
            "auth/invalid-email",
        ].includes(code)
    )
        return "Email atau kata sandi tidak tepat.";
    if (code === "auth/email-already-in-use")
        return "Email ini sudah terdaftar. Silakan gunakan akun lain atau masuk ke akun yang sudah ada.";
    if (code === "auth/too-many-requests")
        return "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";
    if (code === "auth/network-request-failed")
        return "Koneksi bermasalah. Periksa internet Anda lalu coba kembali.";
    return "Terjadi kendala saat memproses permintaan Anda. Silakan coba lagi.";
}
