import type { DemoSession, Holding, Transaction } from "@/types/dashboard";
const key = "asetkita-demo";
export const getDemoSession = (): DemoSession | null => {
    try {
        const value = sessionStorage.getItem(key);
        return value ? (JSON.parse(value) as DemoSession) : null;
    } catch {
        return null;
    }
};
export const saveDemoSession = (session: DemoSession) =>
    sessionStorage.setItem(key, JSON.stringify(session));
export const clearDemoSession = () => sessionStorage.removeItem(key);
export function demoState() {
    const session = getDemoSession();
    const isDemo = session?.isDemo ?? true;
    let balance = session?.balance ?? session?.initialBalance ?? (isDemo ? 1000000 : 10000000);

    if (!isDemo && (balance === 0 || balance === 1000000)) {
        balance = 10000000;
        if (session) {
            saveDemoSession({ ...session, initialBalance: 10000000, balance: 10000000 });
        }
    }

    return {
        balance,
        holdings: session?.holdings ?? ([] as Holding[]),
        transactions: session?.transactions ?? ([] as Transaction[]),
        watchlist: session?.watchlist ?? ([] as string[]),
    };
}
export function saveDemoState(
    data: Partial<
        Pick<DemoSession, "balance" | "holdings" | "transactions" | "watchlist">
    >,
) {
    const session = getDemoSession();
    if (session) saveDemoSession({ ...session, ...data });
}
