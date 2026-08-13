import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, limit, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getDemoSession, saveDemoSession, demoState, saveDemoState } from "@/services/demoService";
import type { LocalAccount } from "@/services/authService";

export async function getUserCloudBalance(uid?: string | null, email?: string | null): Promise<number> {
    const defaultVal = 10000000;
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const sanitizedEmail = cleanEmail ? cleanEmail.replace(/[^a-zA-Z0-9]/g, "_") : null;

    const uidsToTry = Array.from(new Set([uid, sanitizedEmail].filter(Boolean))) as string[];

    // 1. Try checking wallets collection by document ID
    for (const id of uidsToTry) {
        try {
            const snap = await getDoc(doc(db, "wallets", id));
            if (snap.exists() && typeof snap.data()?.balance === "number") {
                return Number(snap.data().balance);
            }
        } catch {}
    }

    // 2. Try checking users collection by document ID
    for (const id of uidsToTry) {
        try {
            const snap = await getDoc(doc(db, "users", id));
            if (snap.exists() && typeof snap.data()?.balance === "number") {
                return Number(snap.data().balance);
            }
        } catch {}
    }

    // 3. Try checking users collection by email query
    if (cleanEmail) {
        try {
            const q = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail), limit(1)));
            if (!q.empty && typeof q.docs[0].data()?.balance === "number") {
                return Number(q.docs[0].data().balance);
            }
        } catch {}
    }

    // 4. Try checking local accounts storage
    if (cleanEmail) {
        try {
            const localStr = localStorage.getItem("asetkita-local-accounts");
            if (localStr) {
                const accounts: LocalAccount[] = JSON.parse(localStr);
                const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
                if (found && typeof found.balance === "number") {
                    return found.balance;
                }
            }
        } catch {}
    }

    return defaultVal;
}

export async function topUpBalance(amount: number, method: string = "QRIS") {
    if (amount <= 0) throw new Error("Nominal top up harus lebih dari 0.");

    const session = getDemoSession();

    // 1. Demo mode account
    if (session?.isDemo) {
        const state = demoState();
        const newBalance = state.balance + amount;
        saveDemoState({ balance: newBalance });
        saveDemoSession({ ...session, balance: newBalance, initialBalance: newBalance });
        return { success: true, balance: newBalance };
    }

    const currentUid = auth.currentUser?.uid;
    const sessionEmail = session?.email || auth.currentUser?.email;
    const cleanEmail = sessionEmail ? sessionEmail.trim().toLowerCase() : null;
    const sanitizedEmail = cleanEmail ? cleanEmail.replace(/[^a-zA-Z0-9]/g, "_") : null;

    // Get current actual balance from any stored location
    const currentBalance = await getUserCloudBalance(currentUid, cleanEmail);
    const newBalance = currentBalance + amount;

    // Collect all document IDs to sync in Cloud Firestore. If authenticated, only sync to UID.
    const idsToSync = currentUid ? [currentUid] : (sanitizedEmail ? [sanitizedEmail] : []);

    let firestoreWritten = false;
    let lastError: any = null;

    for (const id of idsToSync) {
        try {
            await setDoc(
                doc(db, "wallets", id),
                { 
                    uid: id, 
                    balance: newBalance, 
                    currency: "IDR", 
                    email: cleanEmail,
                    updatedAt: serverTimestamp() 
                },
                { merge: true }
            );
            await setDoc(
                doc(db, "users", id),
                { 
                    balance: newBalance, 
                    email: cleanEmail,
                    updatedAt: serverTimestamp() 
                },
                { merge: true }
            );
            try {
                await addDoc(collection(db, "transactions"), {
                    uid: id,
                    symbol: "TOPUP",
                    name: `Top Up Saldo (${method})`,
                    side: "buy",
                    quantity: 1,
                    price: amount,
                    total: amount,
                    status: "completed",
                    createdAt: serverTimestamp(),
                });
            } catch {}
            firestoreWritten = true;
        } catch (e) {
            console.warn(`Write to Firestore failed for id ${id}`, e);
            lastError = e;
        }
    }

    if (idsToSync.length > 0 && !firestoreWritten && lastError) {
        throw new Error(`Gagal menyimpan transaksi ke server: ${lastError.message || lastError}`);
    }

    // Always update session and local storage
    if (session) {
        saveDemoSession({ ...session, balance: newBalance, initialBalance: newBalance });
    }

    if (cleanEmail) {
        try {
            const localAccountsStr = localStorage.getItem("asetkita-local-accounts");
            if (localAccountsStr) {
                const accounts: LocalAccount[] = JSON.parse(localAccountsStr);
                const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
                if (idx !== -1) {
                    accounts[idx].balance = newBalance;
                    localStorage.setItem("asetkita-local-accounts", JSON.stringify(accounts));
                }
            }
        } catch {}
    }

    return { success: true, balance: newBalance };
}
