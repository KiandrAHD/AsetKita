import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { demoState, getDemoSession } from "@/services/demoService";
import { getMarketPrices } from "@/services/marketService";
import type { Allocation, DashboardData, Holding } from "@/types/dashboard";
const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
];
const enrich = (
    holdings: Holding[],
    prices: Record<string, { price: number; changePercent: number }>,
) =>
    holdings.map((item) => ({
        ...item,
        price: prices[item.assetId ?? item.id]?.price ?? item.price,
        changePercent: prices[item.assetId ?? item.id]?.changePercent ?? 0,
    }));
export async function getDashboardData(uid?: string): Promise<DashboardData> {
    const prices = await getMarketPrices();
    const session = getDemoSession();
    if (session?.isDemo) {
        const state = demoState();
        const holdings = enrich(state.holdings, prices);
        const totalAssets = holdings.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
        );
        const total = state.balance + totalAssets;
        const allocation: Allocation[] = holdings.map((item) => ({
            name: item.symbol,
            value: total
                ? Math.round(((item.quantity * item.price) / total) * 100)
                : 0,
            color: item.color,
        }));
        if (state.balance)
            allocation.push({
                name: "Saldo",
                value: Math.max(
                    0,
                    100 - allocation.reduce((sum, item) => sum + item.value, 0),
                ),
                color: "#64748b",
            });
        return {
            mode: session?.isDemo === false ? "member" : "demo",
            profile: {
                uid: session?.email ? `user_${session.email}` : "demo",
                name: session?.nickname ?? "Investor Demo",
                email: session?.email,
                phone: session?.nomorHP,
                financialScore: 85,
            },
            summary: {
                balance: state.balance,
                totalAssets,
                portfolioValue: total,
                financialScore: 0,
            },
            holdings,
            allocation,
            chart: holdings.length
                ? months.map((label, i) => ({
                    label,
                    value: Math.round(total * (0.9 + i * 0.01)),
                }))
                : [],
        };
    }
    try {
        const user = await getDoc(doc(db, "users", uid));
        const wallet = await getDoc(doc(db, "wallets", uid));
        let holdings: Holding[] = [];
        try {
            const portfolios = await getDocs(
                query(collection(db, "portfolios"), where("uid", "==", uid), limit(1)),
            );
            const portfolio = portfolios.docs[0];
            const rows = portfolio
                ? await getDocs(collection(db, "portfolios", portfolio.id, "holdings"))
                : { docs: [] };
            holdings = enrich(
                rows.docs.map((row, index) => {
                    const d = row.data();
                    return {
                        id: row.id,
                        assetId: String(d.assetId ?? row.id),
                        symbol: String(d.symbol),
                        name: String(d.name),
                        quantity: Number(d.quantity),
                        price: Number(d.currentPrice ?? 0),
                        averageBuy: Number(d.averageBuy ?? 0),
                        changePercent: 0,
                        color: ["#22d3ee", "#34d399", "#818cf8"][index % 3],
                    };
                }),
                prices,
            );
        } catch {
            holdings = [];
        }

        const totalAssets = holdings.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
        );
        const profile = user.data() ?? {};
        const session = getDemoSession();
        const balance = Number(wallet.data()?.balance ?? session?.balance ?? 10000000);
        const name = String(profile.namaPanggilan ?? session?.nickname ?? auth.currentUser?.displayName ?? "Investor");

        return {
            mode: "member",
            profile: {
                uid,
                name,
                email: profile.email as string | undefined ?? session?.email ?? auth.currentUser?.email ?? undefined,
                phone: profile.nomorHP as string | undefined ?? session?.nomorHP ?? undefined,
                joinedAt: profile.createdAt?.toDate?.(),
                lastLogin: profile.lastLogin?.toDate?.(),
                financialScore: Number(profile.financialScore ?? 85),
            },
            summary: {
                balance,
                totalAssets,
                portfolioValue: balance + totalAssets,
                financialScore: Number(profile.financialScore ?? 85),
            },
            holdings,
            allocation: holdings.map((h) => ({
                name: h.symbol,
                value: totalAssets
                    ? Math.round(((h.quantity * h.price) / totalAssets) * 100)
                    : 0,
                color: h.color,
            })),
            chart: holdings.length
                ? months.map((label, i) => ({
                    label,
                    value: Math.round((balance + totalAssets) * (0.9 + i * 0.01)),
                }))
                : [],
        };
    } catch {
        const session = getDemoSession();
        const balance = session?.balance ?? 10000000;
        return {
            mode: "member",
            profile: {
                uid: uid ?? "member",
                name: session?.nickname ?? auth.currentUser?.displayName ?? "Investor",
                email: session?.email ?? auth.currentUser?.email ?? undefined,
                phone: session?.nomorHP,
                financialScore: 85,
            },
            summary: {
                balance,
                totalAssets: 0,
                portfolioValue: balance,
                financialScore: 85,
            },
            holdings: [],
            allocation: [],
            chart: [],
        };
    }
}
export async function getMarketSummary() {
    const prices = await getMarketPrices();
    return Object.values(prices)
        .slice(0, 4)
        .map((item) => ({
            symbol: item.assetId.toUpperCase(),
            name: item.assetId.toUpperCase(),
            price: item.price,
            changePercent: item.changePercent,
        }));
}
export async function getLatestNews() {
    return [];
}
