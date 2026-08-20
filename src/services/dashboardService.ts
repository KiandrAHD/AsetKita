import {
    collection,
    doc,
    getDoc,
    getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { demoState, getDemoSession, saveDemoSession } from "@/services/demoService";
import { getMarketPrices } from "@/services/marketService";
import { getUserCloudBalance } from "@/services/walletService";
import { assets } from "@/data/assets";
import type { Allocation, ChartPoint, DashboardData, Holding } from "@/types/dashboard";

const enrich = (
    holdings: Holding[],
    prices: Record<string, { price: number; changePercent: number }>,
): Holding[] =>
    holdings
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => {
            const assetId = item.assetId ?? item.id;
            const asset = assets.find((a) => a.id === assetId || a.symbol === item.symbol);
            const livePrice = prices[assetId]?.price ?? item.price;
            const marketChange = prices[assetId]?.changePercent ?? item.changePercent ?? 0;
            const averageBuy = Number(item.averageBuy) > 0 ? Number(item.averageBuy) : livePrice;
            return {
                ...item,
                assetId,
                price: livePrice,
                averageBuy,
                changePercent: marketChange,
                color: item.color || asset?.color || "#22d3ee",
            };
        });

function buildSummary(balance: number, holdings: Holding[]) {
    const totalAssets = holdings.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.price),
        0,
    );
    const modalInvestasi = holdings.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.averageBuy ?? item.price),
        0,
    );
    const portfolioValue = balance + totalAssets;
    const unrealizedPnL = totalAssets - modalInvestasi;
    const returnPercent = modalInvestasi > 0 ? (unrealizedPnL / modalInvestasi) * 100 : 0;

    let score = 50;
    if (balance > 0) score += 15;
    if (totalAssets > 0) score += 20;
    if (holdings.length >= 2) score += 10;
    if (unrealizedPnL > 0) score += 5;
    const financialScore = Math.min(100, Math.max(0, score));

    return {
        balance,
        totalAssets,
        portfolioValue,
        modalInvestasi,
        unrealizedPnL,
        returnPercent: parseFloat(returnPercent.toFixed(2)),
        financialScore,
    };
}

function buildAllocation(holdings: Holding[]): Allocation[] {
    if (!holdings.length) return [];

    const categoryTotals: Record<string, { value: number; label: string; color: string }> = {
        saham: { value: 0, label: "Saham", color: "#22d3ee" },
        kripto: { value: 0, label: "Kripto", color: "#f59e0b" },
        logam: { value: 0, label: "Logam Mulia", color: "#eab308" },
    };

    let totalAssetsVal = 0;
    for (const h of holdings) {
        const asset = assets.find((a) => a.id === (h.assetId ?? h.id) || a.symbol === h.symbol);
        const catKey = asset?.category ?? "saham";
        const val = Number(h.quantity) * Number(h.price);
        if (categoryTotals[catKey]) {
            categoryTotals[catKey].value += val;
        } else {
            categoryTotals[catKey] = { value: val, label: catKey.toUpperCase(), color: "#34d399" };
        }
        totalAssetsVal += val;
    }

    if (totalAssetsVal <= 0) return [];

    const result: Allocation[] = Object.values(categoryTotals)
        .filter((cat) => cat.value > 0)
        .map((cat) => ({
            name: cat.label,
            value: Math.round((cat.value / totalAssetsVal) * 100),
            color: cat.color,
        }));

    if (result.length > 0) {
        const sum = result.reduce((s, item) => s + item.value, 0);
        if (sum !== 100 && sum > 0) {
            result[0].value += (100 - sum);
        }
    }

    return result;
}

function buildChart(keyId: string, portfolioValue: number, holdingsCount: number): ChartPoint[] {
    if (holdingsCount === 0) return [];

    const storageKey = `asetkita-chart-${keyId}`;
    let history: ChartPoint[] = [];

    try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            history = JSON.parse(cached);
        }
    } catch {}

    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const currentLabel = monthNames[now.getMonth()];

    if (!history.length) {
        // Build 6 initial dynamic historical progression points leading to portfolioValue
        const startMonthIdx = (now.getMonth() - 5 + 12) % 12;
        for (let i = 0; i < 6; i++) {
            const idx = (startMonthIdx + i) % 12;
            const factor = 0.75 + (i * 0.05);
            history.push({
                label: monthNames[idx],
                value: Math.round(portfolioValue * factor),
            });
        }
        history[history.length - 1].value = portfolioValue;
    } else {
        // Update or append current point
        const last = history[history.length - 1];
        if (last && last.label === currentLabel) {
            last.value = portfolioValue;
        } else {
            history.push({ label: currentLabel, value: portfolioValue });
            if (history.length > 12) history.shift();
        }
    }

    try {
        localStorage.setItem(storageKey, JSON.stringify(history));
    } catch {}

    return history;
}

export async function getDashboardData(uid?: string): Promise<DashboardData> {
    const prices = await getMarketPrices();
    const session = getDemoSession();

    if (session?.isDemo) {
        const state = demoState();
        const holdings = enrich(state.holdings, prices);
        const summary = buildSummary(state.balance, holdings);
        const allocation = buildAllocation(holdings);
        const chart = buildChart("demo", summary.portfolioValue, holdings.length);

        return {
            mode: "demo",
            profile: {
                uid: session?.email ? `user_${session.email}` : "demo",
                name: session?.nickname ?? "Investor Demo",
                email: session?.email,
                phone: session?.nomorHP,
                financialScore: summary.financialScore,
            },
            summary,
            holdings,
            allocation,
            chart,
        };
    }

    if (!uid) {
        const email = session?.email ?? auth.currentUser?.email ?? undefined;
        const cloudBalance = await getUserCloudBalance(null, email);
        const summary = buildSummary(cloudBalance, []);
        return {
            mode: "member",
            profile: {
                uid: "member",
                name: session?.nickname ?? auth.currentUser?.displayName ?? "Investor",
                email,
                phone: session?.nomorHP,
                financialScore: summary.financialScore,
            },
            summary,
            holdings: [],
            allocation: [],
            chart: [],
        };
    }

    try {
        let profile: any = {};
        try {
            const user = await getDoc(doc(db, "users", uid));
            if (user.exists()) {
                profile = user.data() ?? {};
            }
        } catch (err) {
            console.warn("Failed to load user profile document:", err);
        }

        let holdings: Holding[] = [];
        try {
            const rows = await getDocs(collection(db, "portfolios", `${uid}_utama`, "holdings"));
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
                        averageBuy: Number(d.averageBuy ?? d.currentPrice ?? 0),
                        changePercent: 0,
                        color: ["#22d3ee", "#34d399", "#818cf8"][index % 3],
                    };
                }),
                prices,
            );
        } catch {
            holdings = [];
        }

        const email = (profile.email as string | undefined) ?? session?.email ?? auth.currentUser?.email;
        const balance = await getUserCloudBalance(uid, email);

        if (session) {
            saveDemoSession({ ...session, balance, initialBalance: balance });
        }

        const name = String(profile.namaPanggilan ?? session?.nickname ?? auth.currentUser?.displayName ?? "Investor");
        const summary = buildSummary(balance, holdings);
        const allocation = buildAllocation(holdings);
        const chart = buildChart(uid, summary.portfolioValue, holdings.length);

        return {
            mode: "member",
            profile: {
                uid,
                name,
                email: (profile.email as string | undefined) ?? session?.email ?? auth.currentUser?.email ?? undefined,
                phone: (profile.nomorHP as string | undefined) ?? session?.nomorHP ?? undefined,
                joinedAt: typeof profile.createdAt?.toDate === "function" ? profile.createdAt.toDate() : (profile.createdAt instanceof Date ? profile.createdAt : undefined),
                lastLogin: typeof profile.lastLogin?.toDate === "function" ? profile.lastLogin.toDate() : (profile.lastLogin instanceof Date ? profile.lastLogin : undefined),
                financialScore: summary.financialScore,
            },
            summary,
            holdings,
            allocation,
            chart,
        };
    } catch {
        const email = session?.email ?? auth.currentUser?.email ?? undefined;
        const balance = await getUserCloudBalance(uid, email);
        const summary = buildSummary(balance, []);
        return {
            mode: "member",
            profile: {
                uid: uid ?? "member",
                name: session?.nickname ?? auth.currentUser?.displayName ?? "Investor",
                email,
                phone: session?.nomorHP,
                financialScore: summary.financialScore,
            },
            summary,
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
