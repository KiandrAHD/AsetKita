import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getDemoSession, saveDemoSession, demoState, saveDemoState } from "@/services/demoService";
import type { LocalAccount } from "@/services/authService";

export async function topUpBalance(amount: number, method: string = "QRIS") {
    if (amount <= 0) throw new Error("Nominal top up harus lebih dari 0.");

    const session = getDemoSession();
    const uid = auth.currentUser?.uid;

    // 1. Demo mode account
    if (session?.isDemo) {
        const state = demoState();
        const newBalance = state.balance + amount;
        saveDemoState({ balance: newBalance });
        saveDemoSession({ ...session, balance: newBalance, initialBalance: newBalance });
        return { success: true, balance: newBalance };
    }

    // 2. Member account on Cloud Firebase
    if (uid) {
        const walletRef = doc(db, "wallets", uid);
        const userRef = doc(db, "users", uid);
        const walletSnap = await getDoc(walletRef);

        const currentBalance = Number(walletSnap.data()?.balance ?? session?.balance ?? 10000000);
        const newBalance = currentBalance + amount;

        await setDoc(
            walletRef,
            {
                uid,
                balance: newBalance,
                currency: "IDR",
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );

        await setDoc(
            userRef,
            {
                balance: newBalance,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );

        try {
            await addDoc(collection(db, "transactions"), {
                uid,
                symbol: "TOPUP",
                name: `Top Up Saldo (${method})`,
                side: "buy",
                quantity: 1,
                price: amount,
                total: amount,
                status: "completed",
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.warn("Transaction log error:", e);
        }

        if (session) {
            saveDemoSession({ ...session, balance: newBalance, initialBalance: newBalance });
        }

        return { success: true, balance: newBalance };
    }

    // 3. Registered local fallback account
    if (session) {
        const currentBalance = session.balance ?? session.initialBalance ?? 10000000;
        const newBalance = currentBalance + amount;
        saveDemoSession({ ...session, balance: newBalance, initialBalance: newBalance });

        const localAccountsStr = localStorage.getItem("asetkita-local-accounts");
        if (localAccountsStr) {
            try {
                const accounts: LocalAccount[] = JSON.parse(localAccountsStr);
                const idx = accounts.findIndex(
                    (a) => a.email.toLowerCase() === session.email?.toLowerCase()
                );
                if (idx !== -1) {
                    accounts[idx].balance = newBalance;
                    localStorage.setItem("asetkita-local-accounts", JSON.stringify(accounts));
                }
            } catch {
                // ignore
            }
        }

        return { success: true, balance: newBalance };
    }

    throw new Error("Gagal memproses Top Up. Sesi tidak ditemukan.");
}
