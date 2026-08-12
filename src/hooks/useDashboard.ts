import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDashboardData } from "@/services/dashboardService";
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

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
