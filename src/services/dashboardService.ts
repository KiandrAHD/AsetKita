import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { getDemoSession } from "@/services/demoService";
import type { Allocation, ChartPoint, DashboardData, Holding, MarketAsset, NewsItem } from "@/types/dashboard";

const colors = ["#22d3ee", "#10b981", "#818cf8", "#f59e0b"];
const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const valueOf = (holding: Holding) => holding.quantity * holding.price;

function demoData(): DashboardData {
  const session = getDemoSession(); const cash = session?.initialBalance ?? 100000;
  const holdings: Holding[] = [
    { id: "btc", symbol: "BTC", name: "Bitcoin", quantity: 0.00022 * cash / 100000, price: 1750000000, changePercent: 4.8, color: colors[0] },
    { id: "bbca", symbol: "BBCA", name: "Bank Central Asia", quantity: Math.max(1, Math.floor(cash * 0.17 / 9000)), price: 9450, changePercent: 1.4, color: colors[1] },
    { id: "eth", symbol: "ETH", name: "Ethereum", quantity: 0.003 * cash / 100000, price: 57000000, changePercent: -0.9, color: colors[2] },
  ];
  const totalAssets = holdings.reduce((sum, item) => sum + valueOf(item), 0); const portfolioValue = cash * 0.35 + totalAssets;
  const allocation: Allocation[] = [...holdings.map((item) => ({ name: item.symbol, value: Math.round(valueOf(item) / portfolioValue * 100), color: item.color })), { name: "Saldo", value: Math.max(0, 100 - holdings.reduce((sum, item) => sum + Math.round(valueOf(item) / portfolioValue * 100), 0)), color: "#64748b" }];
  const chart: ChartPoint[] = months.map((label, index) => ({ label, value: Math.round(portfolioValue * (0.78 + index * 0.025 + (index % 3) * 0.012)) }));
  return { mode: "demo", profile: { uid: "demo", name: session?.nickname ?? "Investor Demo", financialScore: 62 }, summary: { balance: Math.round(cash * 0.35), totalAssets, portfolioValue, financialScore: 62 }, holdings, chart, allocation };
}

export async function getDashboardData(uid?: string): Promise<DashboardData> {
  if (getDemoSession()) return demoData();
  if (!uid) throw new Error("Sesi akun tidak ditemukan.");
  const user = await getDoc(doc(db, "users", uid));
  const wallet = await getDoc(doc(db, "wallets", uid));
  const portfolios = await getDocs(query(collection(db, "portfolios"), where("uid", "==", uid), limit(1)));
  const profile = user.data() ?? {}; const walletData = wallet.data() ?? {}; const portfolio = portfolios.docs[0];
  const holdingDocs = portfolio ? await getDocs(collection(db, "portfolios", portfolio.id, "holdings")) : { docs: [] };
  const holdings: Holding[] = holdingDocs.docs.map((item, index) => { const data = item.data(); return { id: item.id, symbol: String(data.symbol ?? "ASET"), name: String(data.name ?? "Aset"), quantity: Number(data.quantity ?? 0), price: Number(data.currentPrice ?? 0), changePercent: Number(data.changePercent ?? 0), color: colors[index % colors.length] }; });
  const totalAssets = holdings.reduce((sum, item) => sum + valueOf(item), 0);
  const lastLogin = profile.lastLogin?.toDate?.() as Date | undefined;
  return { mode: "member", profile: { uid, name: String(profile.namaPanggilan ?? profile.displayName ?? "Investor"), photoURL: profile.photoURL as string | undefined, lastLogin, financialScore: Number(profile.financialScore ?? 0) }, summary: { balance: Number(walletData.balance ?? 0), totalAssets, portfolioValue: totalAssets, financialScore: Number(profile.financialScore ?? 0) }, holdings, chart: [], allocation: [] };
}

const fallbackMarket: MarketAsset[] = [{ symbol: "BTC", name: "Bitcoin", price: 1715000000, changePercent: 2.34 }, { symbol: "ETH", name: "Ethereum", price: 56800000, changePercent: -1.12 }, { symbol: "BBCA", name: "Bank Central Asia", price: 9450, changePercent: 0.86 }, { symbol: "AAPL", name: "Apple Inc.", price: 3200000, changePercent: 1.45 }];
export async function getMarketSummary(): Promise<MarketAsset[]> { try { return (await httpsCallable<void, { assets: MarketAsset[] }>(functions, "getMarketSnapshot")()).data.assets; } catch { return fallbackMarket; } }
export async function getLatestNews(): Promise<NewsItem[]> { try { return (await httpsCallable<void, { news: NewsItem[] }>(functions, "getLatestNews")()).data.news; } catch { return []; } }
