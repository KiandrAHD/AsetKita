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
    if (getDemoSession() || !uid) {
        const session = getDemoSession();
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
    const user = await getDoc(doc(db, "users", uid));
    const wallet = await getDoc(doc(db, "wallets", uid));
    const portfolios = await getDocs(
        query(collection(db, "portfolios"), where("uid", "==", uid), limit(1)),
    );
    const portfolio = portfolios.docs[0];
    const rows = portfolio
        ? await getDocs(collection(db, "portfolios", portfolio.id, "holdings"))
        : { docs: [] };
    const holdings = enrich(
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
    const totalAssets = holdings.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
    );
    const profile = user.data() ?? {};
    const balance = Number(wallet.data()?.balance ?? 0);
    return {
        mode: "member",
        profile: {
            uid,
            name: String(profile.namaPanggilan ?? "Investor"),
            email: profile.email as string | undefined,
            phone: profile.nomorHP as string | undefined,
            joinedAt: profile.createdAt?.toDate?.(),
            lastLogin: profile.lastLogin?.toDate?.(),
            financialScore: Number(profile.financialScore ?? 0),
        },
        summary: {
            balance,
            totalAssets,
            portfolioValue: balance + totalAssets,
            financialScore: Number(profile.financialScore ?? 0),
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
