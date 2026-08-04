import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type ContactMessageInput = { name: string; email: string; subject: string; message: string };

export async function submitContactMessage(input: ContactMessageInput) {
    return addDoc(collection(db, "contactMessages"), {
        ...input,
        status: "baru",
        createdAt: serverTimestamp(),
        uid: auth.currentUser?.uid ?? null,
    });
}
