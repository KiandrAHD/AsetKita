import type { Asset } from "@/types/dashboard";

export const USD_TO_IDR = 16366;
const usd = (value: number) => Math.round(value * USD_TO_IDR);
type RawCategory = "stock" | "crypto" | "metal";

const make = (
  symbol: string,
  name: string,
  category: RawCategory,
  basePriceRaw: number,
  athRaw: number,
  currency: "IDR" | "USD" = "IDR",
): Asset => ({
  id: symbol.toLowerCase().replace(".", "-"),
  symbol,
  name,
  category:
    category === "stock" ? "saham" : category === "crypto" ? "kripto" : "logam",
  ath: currency === "USD" ? usd(athRaw) : athRaw,
  currency,
  basePrice: currency === "USD" ? usd(basePriceRaw) : basePriceRaw,
  unit: category === "metal" ? "oz" : category === "stock" ? "unit" : "token",
  color: "#10b981",
});

export const ASSETS: Asset[] = [
  // US Stocks (basePrice, ATH in USD)
  make("AAPL", "Apple Inc.", "stock", 228, 237.23, "USD"),
  make("MSFT", "Microsoft Corporation", "stock", 415, 468.35, "USD"),
  make("NVDA", "NVIDIA Corporation", "stock", 135, 140.76, "USD"),
  make("GOOGL", "Alphabet Inc.", "stock", 172, 193.31, "USD"),
  make("AMZN", "Amazon.com Inc.", "stock", 198, 215.90, "USD"),
  make("META", "Meta Platforms Inc.", "stock", 575, 602.95, "USD"),
  make("TSLA", "Tesla Inc.", "stock", 245, 414.50, "USD"),
  make("BRK.B", "Berkshire Hathaway Inc.", "stock", 452, 484.82, "USD"),
  make("LLY", "Eli Lilly and Company", "stock", 820, 972.53, "USD"),
  make("AVGO", "Broadcom Inc.", "stock", 168, 185.20, "USD"),
  make("JPM", "JPMorgan Chase & Co.", "stock", 215, 225.48, "USD"),
  make("WMT", "Walmart Inc.", "stock", 76, 81.36, "USD"),
  make("V", "Visa Inc.", "stock", 278, 293.07, "USD"),
  make("XOM", "Exxon Mobil Corp.", "stock", 112, 126.34, "USD"),
  make("DIS", "The Walt Disney Company", "stock", 98, 201.91, "USD"),

  // Indonesian Stocks (basePrice, ATH in IDR)
  make("BBCA", "Bank Central Asia", "stock", 10450, 10850),
  make("BBRI", "Bank Rakyat Indonesia", "stock", 4750, 6400),
  make("BMRI", "Bank Mandiri", "stock", 6750, 7500),
  make("TLKM", "Telkom Indonesia", "stock", 2850, 4850),
  make("ASII", "Astra International", "stock", 5050, 9000),
  make("BBNI", "Bank Negara Indonesia", "stock", 5400, 6200),
  make("BREN", "Barito Renewables Energy", "stock", 7850, 12200),
  make("BYAN", "Bayan Resources", "stock", 17200, 22500),
  make("GOTO", "GoTo Gojek Tokopedia", "stock", 68, 412),
  make("ICBP", "Indofood CBP", "stock", 11950, 12550),
  make("ANTM", "Aneka Tambang", "stock", 1540, 3440),
  make("KLBF", "Kalbe Farma", "stock", 1650, 2300),
  make("UNVR", "Unilever Indonesia", "stock", 2250, 11150),
  make("UNTR", "United Tractors", "stock", 26800, 35900),
  make("PGAS", "Perusahaan Gas Negara", "stock", 1560, 6150),

  // Crypto Assets (basePrice, ATH in USD)
  // BTC: base price $78,528.60 (Rp 1.285.199.220 IDR), ATH $123,652.50 (Rp 2.023.697.439 IDR)
  make("BTC", "Bitcoin", "crypto", 78528.6, 123652.5, "USD"),
  make("ETH", "Ethereum", "crypto", 3280, 4891, "USD"),
  make("BNB", "BNB", "crypto", 645, 720, "USD"),
  make("SOL", "Solana", "crypto", 195, 260, "USD"),
  make("XRP", "XRP (Ripple)", "crypto", 2.15, 3.84, "USD"),
  make("ADA", "Cardano", "crypto", 0.85, 3.10, "USD"),
  make("DOGE", "Dogecoin", "crypto", 0.32, 0.737, "USD"),
  make("DOT", "Polkadot", "crypto", 7.80, 55.00, "USD"),
  make("LINK", "Chainlink", "crypto", 19.50, 52.88, "USD"),
  make("AVAX", "Avalanche", "crypto", 38.50, 146.22, "USD"),
  make("SHIB", "Shiba Inu", "crypto", 0.000022, 0.000088, "USD"),
  make("TRX", "TRON", "crypto", 0.22, 0.30, "USD"),
  make("LTC", "Litecoin", "crypto", 112, 412.96, "USD"),
  make("BCH", "Bitcoin Cash", "crypto", 440, 4355.62, "USD"),
  make("MATIC", "Polygon", "crypto", 0.48, 2.92, "USD"),

  // Metals (basePrice, ATH in USD per oz)
  make("XRH", "Rhodium", "metal", 4600, 29800, "USD"),
  make("XIR", "Iridium", "metal", 4800, 6000, "USD"),
  make("XAU", "Gold", "metal", 2730, 2790, "USD"),
  make("XPD", "Palladium", "metal", 980, 3440, "USD"),
  make("XPT", "Platinum", "metal", 960, 2290, "USD"),
  make("XOS", "Osmium", "metal", 400, 800, "USD"),
  make("XRU", "Ruthenium", "metal", 450, 850, "USD"),
  make("RE", "Rhenium", "metal", 1600, 4500, "USD"),
  make("XAG", "Silver", "metal", 31.80, 49.80, "USD"),
  make("IN", "Indium", "metal", 320, 1000, "USD"),
];

export const assetBySymbol = (symbol: string) =>
  ASSETS.find((asset) => asset.symbol === symbol);
export const assets = ASSETS;
