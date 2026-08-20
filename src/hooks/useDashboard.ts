import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getDashboardData } from "@/services/dashboardService";
import { subscribeRealTimeMarketPrices } from "@/services/marketService";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard(_user?: User | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getDashboardData(currentUser?.uid ?? auth.currentUser?.uid));
    } catch {
      setError(
        "Data dashboard belum dapat dimuat. Periksa koneksi Anda dan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadSilent = useCallback(async () => {
    try {
      const fresh = await getDashboardData(currentUser?.uid ?? auth.currentUser?.uid);
      setData(fresh);
    } catch {
      // Ignore background errors
    }
  }, [currentUser]);

  useEffect(() => {
    void load();
  }, [load]);

  // Subscribe to real-time market price changes so portfolio updates dynamically
  useEffect(() => {
    const unsub = subscribeRealTimeMarketPrices(() => {
      void loadSilent();
    });
    return () => unsub();
  }, [loadSilent]);

  // Real-time Firestore sync across devices
  useEffect(() => {
    const uid = currentUser?.uid ?? auth.currentUser?.uid;
    if (!uid) return;

    try {
      const walletRef = doc(db, "wallets", uid);
      const unsub = onSnapshot(
        walletRef,
        () => {
          void loadSilent();
        },
        (err) => {
          console.warn("Wallet snapshot listener error:", err);
        }
      );
      return () => unsub();
    } catch {
      // Ignore if Firestore is unavailable
    }
  }, [currentUser, loadSilent]);

  // Sync across tabs/windows on local storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "asetkita-demo" || e.key === "asetkita-local-accounts") {
        void loadSilent();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadSilent]);

  return { data, loading, error, reload: load };
}
