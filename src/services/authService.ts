import {
    browserLocalPersistence,
    browserSessionPersistence,
    setPersistence,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function signIn(email: string, password: string, remember: boolean) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInDemo(customToken: string) {
    return signInWithCustomToken(auth, customToken);
}

export const logout = () => signOut(auth);

export function getAuthErrorMessage(error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "Email atau kata sandi tidak tepat.";
    if (code === "auth/too-many-requests") return "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";
    if (code === "auth/network-request-failed") return "Koneksi bermasalah. Periksa internet Anda lalu coba kembali.";
    return "Terjadi kendala saat memproses permintaan Anda. Silakan coba lagi.";
}
