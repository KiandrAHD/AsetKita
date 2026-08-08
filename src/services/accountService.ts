import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { defaultSettings } from "@/services/marketService";
import type { UserSettings } from "@/types/dashboard";
export async function updateProfile(data: {
    namaLengkap?: string;
    namaPanggilan?: string;
    nomorHP?: string;
}) {
    return (await httpsCallable(functions, "updateProfile")(data)).data;
}
export async function loadSettings(uid: string): Promise<UserSettings> {
    const snap = await getDoc(doc(db, "settings", uid));
    return { ...defaultSettings, ...(snap.data() ?? {}) } as UserSettings;
}
export const getSettings = loadSettings;
export async function saveSettings(settings: UserSettings) {
    await httpsCallable(functions, "updateSettings")(settings);
}
export async function removeAccount() {
    await httpsCallable(functions, "deleteAccount")({});
}
