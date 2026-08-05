import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getDashboardData } from "@/services/dashboardService";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard(user: User | null) {
  const [data, setData] = useState<DashboardData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setData(await getDashboardData(user?.uid)); } catch { setError("Data dashboard belum dapat dimuat. Periksa koneksi Anda dan coba lagi."); } finally { setLoading(false); } }, [user]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  return { data, loading, error, reload: load };
}
