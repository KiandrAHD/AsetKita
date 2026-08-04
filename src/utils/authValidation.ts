export const passwordRules = (password: string) => [
    { label: "Minimal 8 karakter", valid: password.length >= 8 },
    { label: "Mengandung huruf besar", valid: /[A-Z]/.test(password) },
    { label: "Mengandung angka", valid: /\d/.test(password) },
    { label: "Mengandung karakter khusus", valid: /[^A-Za-z0-9]/.test(password) },
];

export const isStrongPassword = (password: string) => passwordRules(password).every((rule) => rule.valid);

export function normalizePhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
    if (digits.startsWith("62")) return `+${digits}`;
    return value.startsWith("+") ? `+${digits}` : `+62${digits}`;
}

export function isIndonesianPhone(value: string) {
    return /^\+62(?:8\d{8,12})$/.test(normalizePhone(value));
}
