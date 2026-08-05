export type AccountMode = "demo" | "member";

export type DemoSession = { nickname: string; initialBalance: number; isDemo: true };
export type DashboardProfile = { uid: string; name: string; photoURL?: string; lastLogin?: Date; financialScore: number };
export type DashboardSummary = { balance: number; totalAssets: number; portfolioValue: number; financialScore: number };
export type Holding = { id: string; symbol: string; name: string; quantity: number; price: number; changePercent: number; color: string };
export type ChartPoint = { label: string; value: number };
export type Allocation = { name: string; value: number; color: string };
export type MarketAsset = { symbol: string; name: string; price: number; changePercent: number; marketCap?: number; volume?: number };
export type NewsItem = { id: string; title: string; source: string; publishedAt: string; url: string; category?: string };
export type DashboardData = { mode: AccountMode; profile: DashboardProfile; summary: DashboardSummary; holdings: Holding[]; chart: ChartPoint[]; allocation: Allocation[] };
