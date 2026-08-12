import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { assets } from "@/data/assets";
import {
    demoState,
    getDemoSession,
    saveDemoState,
} from "@/services/demoService";
import type {
    Asset,
    MarketPrice,
    PriceHistoryPoint,
    Transaction,
    UserSettings,
    Watchlist,
} from "@/types/dashboard";

const USD_TO_IDR = 16000;

// Dynamic In-Memory Store for Live Real-Time Ticker
const livePricesStore: Record<string, MarketPrice> = {};

const bucket = () => Math.floor(Date.now() / (4 * 60 * 60 * 1000));
const seeded = (text: string) => {
    let value = 0;
    for (const char of text) value = (value * 31 + char.charCodeAt(0)) % 100000;
    return value / 100000;
};
const volatility = (asset: Asset) =>
    asset.category === "kripto" ? 0.05 : asset.category === "saham" ? 0.02 : 0.01;
const simulated = (asset: Asset, at = bucket()) => {
    let factor = 0.8;
    for (let i = 0; i <= Math.min(60, at % 365); i += 1)
        factor *=
            1 + (seeded(`${asset.id}:${at - i}`) - 0.5) * 2 * volatility(asset);
    return Math.max(1, Math.round(asset.basePrice * factor));
};

type RemotePrice = {
    price?: number;
    previousPrice?: number;
    changePercent?: number;
    updatedAt?: { toDate?: () => Date };
};

// --- REAL-TIME FREE PUBLIC API FETCHERS ---

// Fetch real-time crypto prices from Binance (100% Free, CORS allowed)
async function fetchBinanceCryptoPrices(): Promise<Map<string, { price: number; changePercent: number }>> {
    const map = new Map<string, { price: number; changePercent: number }>();
    try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return map;
        const data = await res.json();
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item.symbol && item.symbol.endsWith("USDT")) {
                    const symbol = item.symbol.replace("USDT", "");
                    const priceInUsd = parseFloat(item.lastPrice);
                    const changePercent = parseFloat(item.priceChangePercent);
                    if (!isNaN(priceInUsd)) {
                        map.set(symbol, {
                            price: Math.round(priceInUsd * USD_TO_IDR),
                            changePercent: isNaN(changePercent) ? 0 : changePercent,
                        });
                    }
                }
            }
        }
    } catch {
        /* Fallback silently */
    }
    return map;
}

// Fetch real-time prices from CoinGecko Public API as secondary crypto source
async function fetchCoinGeckoCryptoPrices(): Promise<Map<string, { price: number; changePercent: number }>> {
    const map = new Map<string, { price: number; changePercent: number }>();
    try {
        const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,chainlink,avalanche-2,shiba-inu,tron,litecoin,bitcoin-cash,matic-network&vs_currencies=usd&include_24hr_change=true";
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return map;
        const data = await res.json();
        const mapping: Record<string, string> = {
            bitcoin: "BTC",
            ethereum: "ETH",
            binancecoin: "BNB",
            solana: "SOL",
            ripple: "XRP",
            cardano: "ADA",
            dogecoin: "DOGE",
            polkadot: "DOT",
            chainlink: "LINK",
            "avalanche-2": "AVAX",
            "shiba-inu": "SHIB",
            tron: "TRX",
            litecoin: "LTC",
            "bitcoin-cash": "BCH",
            "matic-network": "MATIC",
        };
        for (const [cgId, val] of Object.entries(data)) {
            const symbol = mapping[cgId];
            if (symbol && (val as any).usd) {
                const priceInUsd = (val as any).usd;
                const changePercent = (val as any).usd_24h_change || 0;
                map.set(symbol, {
                    price: Math.round(priceInUsd * USD_TO_IDR),
                    changePercent: parseFloat(changePercent.toFixed(2)),
                });
            }
        }
    } catch {
        /* Fallback silently */
    }
    return map;
}

// Initialize and fetch real-time market prices
export async function getMarketPrices(): Promise<Record<string, MarketPrice>> {
    // If livePricesStore is already populated, return a fresh object copy
    if (Object.keys(livePricesStore).length > 0) {
        return { ...livePricesStore };
    }

    let remote = new Map<string, RemotePrice>();
    try {
        const snap = await getDocs(collection(db, "marketPrices"));
        remote = new Map(
            snap.docs.map((row) => [row.id, row.data() as RemotePrice]),
        );
    } catch {
        /* Firestore fallback */
    }

    // Try API fetchers
    let cryptoMap = await fetchBinanceCryptoPrices();
    if (cryptoMap.size === 0) {
        cryptoMap = await fetchCoinGeckoCryptoPrices();
    }

    for (const asset of assets) {
        const row = remote.get(asset.id);
        let realPriceObj: { price: number; changePercent: number } | null = null;

        if (asset.category === "kripto" && cryptoMap.has(asset.symbol)) {
            realPriceObj = cryptoMap.get(asset.symbol)!;
        }

        let price: number;
        let changePercent: number;
        let previousPrice: number;

        if (realPriceObj) {
            price = realPriceObj.price;
            changePercent = realPriceObj.changePercent;
            previousPrice = Math.round(price / (1 + changePercent / 100));
        } else {
            price = Number(row?.price ?? simulated(asset));
            previousPrice = Number(
                row?.previousPrice ?? simulated(asset, bucket() - 1),
            );
            changePercent = Number(
                row?.changePercent ??
                    ((price / previousPrice - 1) * 100).toFixed(2),
            );
        }

        livePricesStore[asset.id] = {
            assetId: asset.id,
            price,
            previousPrice,
            changePercent,
            updatedAt: row?.updatedAt?.toDate?.() ?? new Date(),
        };
    }

    return { ...livePricesStore };
}

// Subscribe to Live Ticker: updates prices with live API + micro-tick fluctuations every intervalMs (e.g. 3000ms = 3 seconds)
export function subscribeRealTimeMarketPrices(
    onUpdate: (prices: Record<string, MarketPrice>) => void,
    intervalMs = 3000
) {
    // 1. Initial fetch
    void getMarketPrices().then((initialPrices) => {
        onUpdate({ ...initialPrices });
    });

    // 2. Periodic background refresh & micro-tick generator
    let tickCount = 0;
    const intervalId = setInterval(async () => {
        tickCount++;

        // Every 5 ticks (15s), re-fetch API for crypto updates
        if (tickCount % 5 === 0) {
            try {
                const cryptoMap = await fetchBinanceCryptoPrices();
                for (const asset of assets) {
                    if (asset.category === "kripto" && cryptoMap.has(asset.symbol)) {
                        const real = cryptoMap.get(asset.symbol)!;
                        if (livePricesStore[asset.id]) {
                            livePricesStore[asset.id].price = real.price;
                            livePricesStore[asset.id].changePercent = real.changePercent;
                            livePricesStore[asset.id].updatedAt = new Date();
                        }
                    }
                }
            } catch {
                /* Ignore */
            }
        }

        // Apply realistic tick micro-fluctuation to random assets so screen comes ALIVE!
        for (const asset of assets) {
            if (livePricesStore[asset.id]) {
                const current = livePricesStore[asset.id];
                // 30% chance for an asset price to tick each interval
                if (Math.random() < 0.35) {
                    const pctDelta = (Math.random() - 0.49) * 0.003; // +-0.15%
                    const newPrice = Math.max(1, Math.round(current.price * (1 + pctDelta)));
                    current.price = newPrice;
                    current.changePercent = parseFloat((current.changePercent + (pctDelta * 100)).toFixed(2));
                    current.updatedAt = new Date();
                }
            }
        }

        // Send a FRESH object copy so React detects state change and re-renders immediately!
        onUpdate({ ...livePricesStore });
    }, intervalMs);

    return () => clearInterval(intervalId);
}

export function getHistory(assetId: string, currentPrice?: number): PriceHistoryPoint[] {
    const asset = assets.find((item) => item.id === assetId) ?? assets[0];
    const livePrice = currentPrice ?? livePricesStore[assetId]?.price ?? asset.basePrice;

    const points: PriceHistoryPoint[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 29; i >= 0; i--) {
        const atDate = new Date(now - i * dayMs);
        const label = atDate.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
        });

        if (i === 0) {
            // The final point is ALWAYS the exact live price
            points.push({ label, value: livePrice, at: atDate });
        } else {
            // Calculate historical curve leading smoothly to the live price
            const stepFactor = 1 - (i * 0.008) + (seeded(`${asset.id}:${i}`) - 0.5) * 0.04;
            const val = Math.max(1, Math.round(livePrice * Math.max(0.7, stepFactor)));
            points.push({ label, value: val, at: atDate });
        }
    }

    return points;
}

export async function getWatchlist(uid?: string): Promise<Watchlist> {
    if (getDemoSession()) return { assetIds: demoState().watchlist };
    if (!uid) return { assetIds: [] };
    try {
        const snap = await getDocs(
            query(collection(db, "watchlists"), where("uid", "==", uid)),
        );
        return { assetIds: (snap.docs[0]?.data()?.assetIds ?? []) as string[] };
    } catch {
        return { assetIds: [] };
    }
}

export function subscribeWatchlist(
    uid: string | undefined,
    onChange: (watchlist: Watchlist) => void,
) {
    if (getDemoSession()) {
        onChange({ assetIds: demoState().watchlist });
        return () => undefined;
    }
    if (!uid) {
        onChange({ assetIds: [] });
        return () => undefined;
    }
    const q = query(collection(db, "watchlists"), where("uid", "==", uid));
    return onSnapshot(q, (snapshot) => {
        const doc = snapshot.docs[0];
        onChange({ assetIds: (doc?.data()?.assetIds ?? []) as string[] });
    });
}

export async function toggleWatchlist(
    uid: string | undefined,
    assetId: string,
): Promise<Watchlist> {
    if (getDemoSession()) {
        const state = demoState();
        const assetIds = state.watchlist.includes(assetId)
            ? state.watchlist.filter((id) => id !== assetId)
            : [...state.watchlist, assetId];
        saveDemoState({ watchlist: assetIds });
        return { assetIds };
    }
    if (!uid) throw new Error("Sesi tidak ditemukan.");
    return (await httpsCallable(functions, "toggleWatchlist")({ assetId }))
        .data as Watchlist;
}

export async function trade(
    uid: string | undefined,
    asset: Asset,
    side: "buy" | "sell",
    quantity: number,
    price: number,
) {
    if (quantity <= 0) throw new Error("Jumlah harus lebih besar dari nol.");
    if (getDemoSession()) {
        const state = demoState();
        const current = state.holdings.find(
            (holding) => holding.assetId === asset.id,
        );
        const total = quantity * price;
        if (side === "buy" && state.balance < total)
            throw new Error("Saldo demo tidak mencukupi.");
        if (side === "sell" && (!current || current.quantity < quantity))
            throw new Error("Holding tidak mencukupi.");
        const holdings = [...state.holdings];
        if (side === "buy") {
            if (current) current.quantity += quantity;
            else
                holdings.push({
                    id: asset.id,
                    assetId: asset.id,
                    symbol: asset.symbol,
                    name: asset.name,
                    quantity,
                    price,
                    averageBuy: price,
                    changePercent: 0,
                    color: asset.color,
                });
        } else if (current) {
            current.quantity -= quantity;
            if (current.quantity <= 0) holdings.splice(holdings.indexOf(current), 1);
        }
        const transaction: Transaction = {
            id: `demo-${Date.now()}`,
            assetId: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            side,
            quantity,
            price,
            total,
            status: "completed",
            createdAt: new Date(),
        };
        saveDemoState({
            balance: state.balance + (side === "buy" ? -total : total),
            holdings,
            transactions: [transaction, ...state.transactions],
        });
        return;
    }
    if (!uid) throw new Error("Sesi tidak ditemukan.");
    await httpsCallable(
        functions,
        "executeTrade",
    )({ assetId: asset.id, side, quantity });
}

export async function getTransactions(uid?: string): Promise<Transaction[]> {
    if (getDemoSession()) return demoState().transactions;
    if (!uid) return [];
    const snap = await getDocs(
        query(collection(db, "transactions"), where("uid", "==", uid)),
    );
    return snap.docs.map((row) => ({
        ...row.data(),
        id: row.id,
        createdAt: row.data().createdAt?.toDate?.() ?? new Date(),
    })) as Transaction[];
}

export const defaultSettings: UserSettings = {
    marketAlerts: true,
    aiInsights: false,
    systemNotifications: true,
    emailDigest: false,
    analytics: true,
    personalizedRecommendations: true,
    portfolioSharing: false,
};
