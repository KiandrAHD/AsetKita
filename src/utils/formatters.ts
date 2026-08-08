export const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
export const formatPercent = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
export const formatCompactRupiah = (value?: number) =>
    value
        ? new Intl.NumberFormat("id-ID", {
            notation: "compact",
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 1,
        }).format(value)
        : "—";
export const formatLastLogin = (value?: Date) =>
    value
        ? new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(value)
        : "Baru saja";
export const greeting = () => {
    const hour = new Date().getHours();
    return hour < 11
        ? "Selamat Pagi"
        : hour < 15
            ? "Selamat Siang"
            : hour < 18
                ? "Selamat Sore"
                : "Selamat Malam";
};
