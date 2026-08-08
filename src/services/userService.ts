import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function recordLastLogin(uid: string) {
    await updateDoc(doc(db, "users", uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}
