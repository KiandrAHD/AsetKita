import type { DemoSession } from "@/types/dashboard";

const key = "asetkita-demo";
export const getDemoSession = (): DemoSession | null => { try { const value = sessionStorage.getItem(key); return value ? JSON.parse(value) as DemoSession : null; } catch { return null; } };
export const saveDemoSession = (session: DemoSession) => sessionStorage.setItem(key, JSON.stringify(session));
export const clearDemoSession = () => sessionStorage.removeItem(key);
