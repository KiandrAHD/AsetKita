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
    let balance = session?.balance ?? session?.initialBalance ?? 0;

    // Preserve demo simulation balances (isDemo === true).
    // For real registered accounts (isDemo === false), reset legacy 1M initial balance to 0.
    if (!isDemo && (balance === 1000000 || session?.initialBalance === 1000000)) {
        balance = 0;
        if (session) {
            saveDemoSession({ ...session, initialBalance: 0, balance: 0 });
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
