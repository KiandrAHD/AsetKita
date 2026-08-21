import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
    runTransaction,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { assets, USD_TO_IDR } from "@/data/assets";
import {
    demoState,
    getDemoSession,
    saveDemoState,
} from "@/services/demoService";
import type {
    Asset,
    MarketPrice,
    PriceHistoryPoint,
    TimeFrame,
    Transaction,
    UserSettings,
    Watchlist,
} from "@/types/dashboard";

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
    let factor = 0.95 + (seeded(`${asset.id}:${at}`) - 0.5) * 2 * volatility(asset);
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

// Fetch real-time prices from CoinGecko Public API (with direct IDR orderbook conversion)
async function fetchCoinGeckoCryptoPrices(): Promise<Map<string, { price: number; changePercent: number }>> {
    const map = new Map<string, { price: number; changePercent: number }>();
    try {
        const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,chainlink,avalanche-2,shiba-inu,tron,litecoin,bitcoin-cash,matic-network&vs_currencies=idr,usd&include_24hr_change=true";
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
            const itemObj = val as any;
            if (symbol && (itemObj.idr || itemObj.usd)) {
                const priceInIdr = itemObj.idr ? Math.round(itemObj.idr) : Math.round(itemObj.usd * USD_TO_IDR);
                const changePercent = itemObj.idr_24h_change ?? itemObj.usd_24h_change ?? 0;
                map.set(symbol, {
                    price: priceInIdr,
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

    // Try API fetchers (CoinGecko with direct IDR orderbook price first, Binance as secondary)
    let cryptoMap = await fetchCoinGeckoCryptoPrices();
    if (cryptoMap.size === 0) {
        cryptoMap = await fetchBinanceCryptoPrices();
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
                let cryptoMap = await fetchCoinGeckoCryptoPrices();
                if (cryptoMap.size === 0) {
                    cryptoMap = await fetchBinanceCryptoPrices();
                }
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
                    const pctDelta = (Math.random() - 0.49) * 0.002; // +-0.1% micro fluctuation
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

// In-memory cache for asset price history by key `${assetId}:${timeframe}`
const historyCache = new Map<string, PriceHistoryPoint[]>();

// Fetch real Binance Klines for Crypto across timeframes (High Density 100-365 points)
async function fetchBinanceKlines(
    symbol: string,
    timeframe: TimeFrame,
): Promise<PriceHistoryPoint[] | null> {
    try {
        let interval = "1d";
        let limit = 120;

        switch (timeframe) {
            case "1D":
                interval = "15m";
                limit = 96; // 96 data points (every 15 min)
                break;
            case "1W":
                interval = "1h";
                limit = 168; // 168 data points (every 1 hour for 7 days)
                break;
            case "1M":
                interval = "4h";
                limit = 180; // 180 data points (every 4 hours for 30 days)
                break;
            case "1Y":
                interval = "1d";
                limit = 365; // 365 data points (daily for 1 year)
                break;
            case "10Y":
                interval = "1w";
                limit = 520; // 520 data points (weekly for 10 years)
                break;
            case "MAX":
                interval = "1w";
                limit = 800; // 800 data points for max historical timeline
                break;
        }

        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;

        const points: PriceHistoryPoint[] = [];

        for (const item of data) {
            const openTimeMs = item[0] as number;
            const closePriceUsd = parseFloat(item[4]);
            if (isNaN(closePriceUsd)) continue;

            const dateObj = new Date(openTimeMs);
            let label = "";

            if (timeframe === "1D") {
                label = dateObj.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } else if (timeframe === "1W" || timeframe === "1M") {
                label = dateObj.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                });
            } else if (timeframe === "1Y") {
                label = dateObj.toLocaleDateString("id-ID", {
                    month: "short",
                    year: "2-digit",
                });
            } else {
                label = dateObj.getFullYear().toString();
            }

            points.push({
                label,
                value: Math.round(closePriceUsd * USD_TO_IDR),
                at: dateObj,
            });
        }

        return points.length > 0 ? points : null;
    } catch {
        return null;
    }
}

// Ticker mapping for Yahoo Finance
const yahooSymbolMap: Record<string, string> = {
    BBCA: "BBCA.JK",
    BBRI: "BBRI.JK",
    BMRI: "BMRI.JK",
    TLKM: "TLKM.JK",
    ASII: "ASII.JK",
    BBNI: "BBNI.JK",
    BREN: "BREN.JK",
    BYAN: "BYAN.JK",
    GOTO: "GOTO.JK",
    ICBP: "ICBP.JK",
    ANTM: "ANTM.JK",
    KLBF: "KLBF.JK",
    UNVR: "UNVR.JK",
    UNTR: "UNTR.JK",
    PGAS: "PGAS.JK",
    AAPL: "AAPL",
    MSFT: "MSFT",
    NVDA: "NVDA",
    GOOGL: "GOOGL",
    AMZN: "AMZN",
    META: "META",
    TSLA: "TSLA",
    "BRK.B": "BRK-B",
    LLY: "LLY",
    AVGO: "AVGO",
    JPM: "JPM",
    WMT: "WMT",
    V: "V",
    XOM: "XOM",
    DIS: "DIS",
    XAU: "GC=F",
    XAG: "SI=F",
    XPT: "PL=F",
    XPD: "PA=F",
};

// Fetch real Yahoo Finance historical chart data for Stocks & Metals (100% Real Trading Data)
async function fetchYahooStockKlines(
    symbol: string,
    timeframe: TimeFrame,
    isUsdAsset: boolean
): Promise<PriceHistoryPoint[] | null> {
    const yahooSymbol = yahooSymbolMap[symbol];
    if (!yahooSymbol) return null;

    try {
        let range = "1mo";
        let interval = "1d";

        switch (timeframe) {
            case "1D":
                range = "1d";
                interval = "15m";
                break;
            case "1W":
                range = "5d";
                interval = "30m";
                break;
            case "1M":
                range = "1mo";
                interval = "1d";
                break;
            case "1Y":
                range = "1y";
                interval = "1d";
                break;
            case "10Y":
                range = "10y";
                interval = "1wk";
                break;
            case "MAX":
                range = "max";
                interval = "1mo";
                break;
        }

        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`;
        let res = await fetch(targetUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(4000),
        }).catch(() => null);

        if (!res || !res.ok) {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) }).catch(() => null);
        }

        if (!res || !res.ok) return null;
        const data = await res.json();

        const result = data?.chart?.result?.[0];
        if (!result) return null;

        const timestamps: number[] = result.timestamp || [];
        const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
        if (!timestamps.length || !closes.length) return null;

        const points: PriceHistoryPoint[] = [];

        for (let i = 0; i < timestamps.length; i++) {
            const rawVal = closes[i];
            if (rawVal === null || rawVal === undefined || isNaN(rawVal) || rawVal <= 0) continue;

            const dateObj = new Date(timestamps[i] * 1000);
            let label = "";

            if (timeframe === "1D") {
                label = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            } else if (timeframe === "1W" || timeframe === "1M") {
                label = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
            } else if (timeframe === "1Y") {
                label = dateObj.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
            } else {
                label = dateObj.getFullYear().toString();
            }

            const valInIdr = isUsdAsset ? Math.round(rawVal * USD_TO_IDR) : Math.round(rawVal);

            points.push({
                label,
                value: valInIdr,
                at: dateObj,
            });
        }

        return points.length > 0 ? points : null;
    } catch {
        return null;
    }
}

// High-accuracy organic fallback generator (No artificial sine waves!)
function generateBoundedHistory(
    asset: Asset,
    timeframe: TimeFrame,
    currentLivePrice: number,
): PriceHistoryPoint[] {
    const points: PriceHistoryPoint[] = [];
    const now = Date.now();
    const maxAthIdr = asset.ath;

    let pointCount = 120;
    let stepMs = 6 * 60 * 60 * 1000;
    let baseHistoricalScale = 0.88;

    switch (timeframe) {
        case "1D":
            pointCount = 96;
            stepMs = 15 * 60 * 1000;
            baseHistoricalScale = 0.988;
            break;
        case "1W":
            pointCount = 112;
            stepMs = 90 * 60 * 1000;
            baseHistoricalScale = 0.96;
            break;
        case "1M":
            pointCount = 120;
            stepMs = 6 * 60 * 60 * 1000;
            baseHistoricalScale = 0.92;
            break;
        case "1Y":
            pointCount = 120;
            stepMs = 3 * 24 * 60 * 60 * 1000;
            baseHistoricalScale = 0.72;
            break;
        case "10Y":
            pointCount = 120;
            stepMs = 30 * 24 * 60 * 60 * 1000;
            baseHistoricalScale = asset.category === "kripto" ? 0.05 : 0.35;
            break;
        case "MAX":
            pointCount = 150;
            stepMs = 45 * 24 * 60 * 60 * 1000;
            baseHistoricalScale = asset.category === "kripto" ? 0.01 : 0.20;
            break;
    }

    const rawValues: number[] = new Array(pointCount);
    rawValues[pointCount - 1] = currentLivePrice;

    const startPrice = Math.min(maxAthIdr * 0.95, currentLivePrice * baseHistoricalScale);

    let currVal = startPrice;
    rawValues[0] = Math.round(startPrice);

    for (let i = 1; i < pointCount - 1; i++) {
        const progress = i / (pointCount - 1);
        const seedVal = seeded(`${asset.id}:${timeframe}:${i}`);
        
        const targetVal = startPrice + (currentLivePrice - startPrice) * Math.pow(progress, 1.1);
        const noise = (seedVal - 0.49) * 0.015;
        const pull = (targetVal - currVal) * 0.15;
        
        currVal = currVal + pull + (currVal * noise);
        currVal = Math.max(1, Math.min(maxAthIdr, currVal));
        rawValues[i] = Math.round(currVal);
    }

    for (let i = 0; i < pointCount; i++) {
        const offsetFromEnd = pointCount - 1 - i;
        const atDate = new Date(now - offsetFromEnd * stepMs);
        let label = "";

        if (timeframe === "1D") {
            label = atDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        } else if (timeframe === "1W" || timeframe === "1M") {
            label = atDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        } else if (timeframe === "1Y") {
            label = atDate.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        } else {
            label = atDate.getFullYear().toString();
        }

        points.push({
            label,
            value: rawValues[i],
            at: atDate,
        });
    }

    return points;
}

// Synchronous getHistory (returns cached or generated points immediately)
export function getHistory(
    assetId: string,
    currentPrice?: number,
    timeframe: TimeFrame = "1M"
): PriceHistoryPoint[] {
    const asset = assets.find((item) => item.id === assetId) ?? assets[0];
    const livePrice = currentPrice ?? livePricesStore[assetId]?.price ?? asset.basePrice;
    const cacheKey = `${assetId}:${timeframe}`;

    const cached = historyCache.get(cacheKey);
    if (cached && cached.length > 0) {
        const updated = [...cached];
        updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            value: livePrice,
        };
        return updated;
    }

    const fallback = generateBoundedHistory(asset, timeframe, livePrice);
    historyCache.set(cacheKey, fallback);

    if (asset.category === "kripto") {
        void fetchBinanceKlines(asset.symbol, timeframe).then((realPoints) => {
            if (realPoints && realPoints.length > 0) {
                historyCache.set(cacheKey, realPoints);
                window.dispatchEvent(
                    new CustomEvent("asetkita-history-updated", {
                        detail: { assetId, timeframe },
                    })
                );
            }
        });
    } else {
        void fetchYahooStockKlines(asset.symbol, timeframe, asset.currency === "USD").then((realPoints) => {
            if (realPoints && realPoints.length > 0) {
                historyCache.set(cacheKey, realPoints);
                window.dispatchEvent(
                    new CustomEvent("asetkita-history-updated", {
                        detail: { assetId, timeframe },
                    })
                );
            }
        });
    }

    return fallback;
}

// Asynchronous fetchAssetHistory (fetches real API first, fallback if unavailable)
export async function fetchAssetHistory(
    assetId: string,
    timeframe: TimeFrame = "1M",
    currentPrice?: number
): Promise<PriceHistoryPoint[]> {
    const asset = assets.find((item) => item.id === assetId) ?? assets[0];
    const livePrice = currentPrice ?? livePricesStore[assetId]?.price ?? asset.basePrice;
    const cacheKey = `${assetId}:${timeframe}`;

    if (asset.category === "kripto") {
        const realPoints = await fetchBinanceKlines(asset.symbol, timeframe);
        if (realPoints && realPoints.length > 0) {
            historyCache.set(cacheKey, realPoints);
            return realPoints;
        }
    } else {
        const realPoints = await fetchYahooStockKlines(asset.symbol, timeframe, asset.currency === "USD");
        if (realPoints && realPoints.length > 0) {
            historyCache.set(cacheKey, realPoints);
            return realPoints;
        }
    }

    const fallback = generateBoundedHistory(asset, timeframe, livePrice);
    historyCache.set(cacheKey, fallback);
    return fallback;
}

const getLocalWatchlist = (uid?: string): string[] => {
    try {
        const key = `asetkita-watchlist-${uid ?? "member"}`;
        const val = localStorage.getItem(key);
        return val ? (JSON.parse(val) as string[]) : ["nvda", "aapl", "btc"];
    } catch {
        return ["nvda", "aapl", "btc"];
    }
};

const setLocalWatchlist = (assetIds: string[], uid?: string) => {
    try {
        const key = `asetkita-watchlist-${uid ?? "member"}`;
        localStorage.setItem(key, JSON.stringify(assetIds));
        window.dispatchEvent(new CustomEvent("asetkita-watchlist-changed", { detail: { assetIds } }));
    } catch {}
};

export async function getWatchlist(uid?: string): Promise<Watchlist> {
    if (getDemoSession()?.isDemo) {
        const state = demoState();
        // If empty demo state watchlist on first load, initialize with default array
        if (!state.watchlist || state.watchlist.length === 0) {
            const initial = ["nvda", "aapl", "btc"];
            saveDemoState({ watchlist: initial });
            return { assetIds: initial };
        }
        return { assetIds: state.watchlist };
    }
    const local = getLocalWatchlist(uid);
    if (!uid) return { assetIds: local };
    try {
        const snap = await getDocs(
            query(collection(db, "watchlists"), where("uid", "==", uid)),
        );
        const cloudIds = snap.docs[0]?.data()?.assetIds as string[] | undefined;
        return { assetIds: cloudIds ?? local };
    } catch {
        return { assetIds: local };
    }
}

export function subscribeWatchlist(
    uid: string | undefined,
    onChange: (watchlist: Watchlist) => void,
) {
    const notifyCurrent = async () => {
        const wl = await getWatchlist(uid);
        onChange(wl);
    };

    void notifyCurrent();

    const handleCustomEvent = (e: Event) => {
        const customEv = e as CustomEvent<{ assetIds: string[] }>;
        if (customEv.detail?.assetIds) {
            onChange({ assetIds: customEv.detail.assetIds });
        } else {
            void notifyCurrent();
        }
    };

    const handleStorageEvent = (e: StorageEvent) => {
        if (e.key?.includes("watchlist") || e.key === "asetkita-demo") {
            void notifyCurrent();
        }
    };

    window.addEventListener("asetkita-watchlist-changed", handleCustomEvent);
    window.addEventListener("storage", handleStorageEvent);

    let unsubFirestore: (() => void) | null = null;
    if (!getDemoSession()?.isDemo && uid) {
        try {
            const q = query(collection(db, "watchlists"), where("uid", "==", uid));
            unsubFirestore = onSnapshot(q, (snapshot) => {
                const docSnap = snapshot.docs[0];
                if (docSnap?.exists()) {
                    const assetIds = (docSnap.data()?.assetIds ?? []) as string[];
                    setLocalWatchlist(assetIds, uid);
                    onChange({ assetIds });
                }
            }, () => { /* ignore firestore subscription errors */ });
        } catch { /* fallback silently */ }
    }

    return () => {
        window.removeEventListener("asetkita-watchlist-changed", handleCustomEvent);
        window.removeEventListener("storage", handleStorageEvent);
        if (unsubFirestore) unsubFirestore();
    };
}

export async function toggleWatchlist(
    uid: string | undefined,
    assetId: string,
): Promise<Watchlist> {
    if (getDemoSession()?.isDemo) {
        const state = demoState();
        const currentList = state.watchlist && state.watchlist.length > 0 ? state.watchlist : ["nvda", "aapl", "btc"];
        const assetIds = currentList.includes(assetId)
            ? currentList.filter((id) => id !== assetId)
            : [...currentList, assetId];
        saveDemoState({ watchlist: assetIds });
        window.dispatchEvent(new CustomEvent("asetkita-watchlist-changed", { detail: { assetIds } }));
        return { assetIds };
    }

    const localList = getLocalWatchlist(uid);
    const assetIds = localList.includes(assetId)
        ? localList.filter((id) => id !== assetId)
        : [...localList, assetId];
    
    setLocalWatchlist(assetIds, uid);

    if (uid) {
        try {
            const res = await httpsCallable(functions, "toggleWatchlist")({ assetId });
            const data = res.data as Watchlist;
            if (data?.assetIds) {
                setLocalWatchlist(data.assetIds, uid);
                return data;
            }
        } catch {
            // Cloud function might not be deployed locally, fallback to local storage state
        }
    }

    return { assetIds };
}


export async function trade(
    uid: string | undefined,
    asset: Asset,
    side: "buy" | "sell",
    quantity: number,
    price: number,
) {
    if (quantity <= 0) throw new Error("Jumlah harus lebih besar dari nol.");
    if (getDemoSession()?.isDemo) {
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
            if (current) {
                const oldQty = Number(current.quantity) || 0;
                const oldAvg = Number(current.averageBuy ?? current.price) || price;
                const newQty = oldQty + quantity;
                const newAvg = (oldQty * oldAvg + total) / newQty;
                current.quantity = newQty;
                current.averageBuy = newAvg;
                current.price = price;
            } else {
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
            }
        } else if (current) {
            current.quantity -= quantity;
            if (current.quantity <= 0) {
                const idx = holdings.findIndex((h) => (h.assetId ?? h.id) === asset.id);
                if (idx !== -1) holdings.splice(idx, 1);
            }
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
    
    const portfolioId = `${uid}_utama`;
    const walletRef = doc(db, "wallets", uid);
    const userRef = doc(db, "users", uid);
    const holdingRef = doc(db, "portfolios", portfolioId, "holdings", asset.id);
    const transactionRef = doc(collection(db, "transactions"));
    const priceRef = doc(db, "marketPrices", asset.id);

    await runTransaction(db, async (tx) => {
        const [priceSnap, walletSnap, holdingSnap] = await Promise.all([
            tx.get(priceRef),
            tx.get(walletRef),
            tx.get(holdingRef),
        ]);

        let currentPrice = Number(priceSnap.data()?.price);
        if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
            currentPrice = price || asset.basePrice;
        }

        const total = currentPrice * quantity;
        const balance = Number(walletSnap.data()?.balance ?? 0);
        const oldQuantity = Number(holdingSnap.data()?.quantity ?? 0);

        if (side === "buy") {
            if (balance < total) throw new Error("Saldo tidak mencukupi.");
            const oldAvg = Number(holdingSnap.data()?.averageBuy ?? holdingSnap.data()?.currentPrice ?? currentPrice);
            const newQty = oldQuantity + quantity;
            const newAvg = oldQuantity > 0 ? ((oldQuantity * oldAvg) + total) / newQty : currentPrice;
            
            tx.set(walletRef, { 
                uid, 
                balance: balance - total, 
                updatedAt: serverTimestamp() 
            }, { merge: true });

            tx.set(userRef, { 
                balance: balance - total, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
            
            tx.set(holdingRef, { 
                assetId: asset.id, 
                symbol: asset.symbol, 
                name: asset.name, 
                quantity: newQty, 
                averageBuy: newAvg, 
                currentPrice, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
        } else {
            if (oldQuantity < quantity) throw new Error("Jumlah aset tidak mencukupi.");
            
            tx.set(walletRef, { 
                uid, 
                balance: balance + total, 
                updatedAt: serverTimestamp() 
            }, { merge: true });

            tx.set(userRef, { 
                balance: balance + total, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
            
            if (oldQuantity <= quantity) {
                tx.delete(holdingRef);
            } else {
                tx.update(holdingRef, { 
                    quantity: oldQuantity - quantity, 
                    currentPrice, 
                    updatedAt: serverTimestamp() 
                });
            }
        }

        tx.set(transactionRef, { 
            uid, 
            assetId: asset.id, 
            symbol: asset.symbol, 
            name: asset.name, 
            side, 
            quantity, 
            price: currentPrice, 
            total, 
            status: "completed", 
            createdAt: serverTimestamp() 
        });
    });
}

export async function getTransactions(uid?: string): Promise<Transaction[]> {
    if (getDemoSession()?.isDemo) return demoState().transactions;
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
