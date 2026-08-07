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
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const TESTER_EMAIL = "tester@gmail.com";
const TESTER_PASSWORD = "Tester123!";

export async function signIn(email: string, password: string, remember: boolean) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email.trim(), password);
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
        setDoc(doc(db, "wallets", uid), { uid, balance: 0, currency: "IDR", createdAt: now, updatedAt: now }),
        setDoc(doc(db, "portfolios", `${uid}_utama`), { uid, name: "Portofolio Utama", type: "primary", createdAt: now, updatedAt: now }),
        setDoc(doc(db, "watchlists", uid), { uid, assetIds: [], createdAt: now, updatedAt: now }),
        setDoc(doc(db, "settings", uid), { marketAlerts: true, aiInsights: false, systemNotifications: true, emailDigest: false, analytics: true, personalizedRecommendations: true, portfolioSharing: false }),
    ]);
}

export async function ensureTesterAccount() {
    if (auth.currentUser?.email === TESTER_EMAIL) return;

    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, TESTER_EMAIL, TESTER_PASSWORD);
    } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (code !== "auth/user-not-found") throw error;

        const { user } = await createUserWithEmailAndPassword(auth, TESTER_EMAIL, TESTER_PASSWORD);
        await seedTesterProfile(user.uid);
        await sendEmailVerification(user);
    }
}

export function getAuthErrorMessage(error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "Email atau kata sandi tidak tepat.";
    if (code === "auth/email-already-in-use") return "Email ini sudah terdaftar. Silakan gunakan akun lain atau masuk ke akun yang sudah ada.";
    if (code === "auth/too-many-requests") return "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";
    if (code === "auth/network-request-failed") return "Koneksi bermasalah. Periksa internet Anda lalu coba kembali.";
    return "Terjadi kendala saat memproses permintaan Anda. Silakan coba lagi.";
}
