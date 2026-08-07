import { useRef } from "react";

export default function OtpInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const refs = useRef<Array<HTMLInputElement | null>>([]);
    const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");
    const setDigit = (index: number, input: string) => {
        const digit = input.replace(/\D/g, "").slice(-1);
        const next = digits
            .map((item, itemIndex) => (itemIndex === index ? digit : item))
            .join("");
        onChange(next);
        if (digit && index < 5) refs.current[index + 1]?.focus();
    };
    return (
        <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(element) => {
                        refs.current[index] = element;
                    }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Backspace" && !digit && index > 0)
                            refs.current[index - 1]?.focus();
                    }}
                    className="h-12 w-10 rounded-xl border border-white/10 bg-[#111827] text-center text-lg font-semibold text-cyan-200 outline-none transition focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10 sm:h-14 sm:w-12"
                />
            ))}
        </div>
    );
}
