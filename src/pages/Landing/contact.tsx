import { useState } from "react";
import {
    Clock3,
    ExternalLink,
    Globe2,
    Mail,
    MapPin,
    MessageCircle,
    Send,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import MarketingShell from "@/components/marketing/MarketingShell";
import { submitContactMessage } from "@/services/contactService";

const contactSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nama minimal 2 karakter.")
        .max(100, "Nama maksimal 100 karakter."),
    email: z.string().trim().email("Masukkan alamat email yang valid.").max(254),
    subject: z
        .string()
        .trim()
        .min(3, "Subjek minimal 3 karakter.")
        .max(150, "Subjek maksimal 150 karakter."),
    message: z
        .string()
        .trim()
        .min(10, "Pesan minimal 10 karakter.")
        .max(2000, "Pesan maksimal 2.000 karakter."),
});
type ContactValues = z.infer<typeof contactSchema>;
const details = [
    {
        title: "Email",
        value: "hello@asetkita.id",
        note: "Respons maksimal 24 jam",
        icon: Mail,
        href: "mailto:hello@asetkita.id",
    },
    {
        title: "WhatsApp",
        value: "+62 851-9608-6455",
        note: "Senin–Jumat, 09.00–18.00 WIB",
        icon: MessageCircle,
        href: "https://wa.me/6285196086455",
    },
    {
        title: "Alamat",
        value: "SCBD, Jakarta Selatan",
        note: "Jakarta 12190, Indonesia",
        icon: MapPin,
        href: "#lokasi",
    },
    {
        title: "Jam Operasional",
        value: "Senin–Jumat",
        note: "09.00–18.00 WIB",
        icon: Clock3,
        href: "#form-kontak",
    },
];
const socialLinks = [
    { label: "X", icon: Globe2 },
    { label: "Instagram", icon: Globe2 },
    { label: "LinkedIn", icon: Globe2 },
    { label: "Facebook", icon: Globe2 },
];

export default function Contact() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactValues>();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const onSubmit = async (values: ContactValues) => {
        setStatus("idle");
        const parsed = contactSchema.safeParse(values);
        if (!parsed.success) return;
        try {
            await submitContactMessage(parsed.data);
            reset();
            setStatus("success");
        } catch {
            setStatus("error");
        }
    };
    const field = (name: keyof ContactValues) => ({
        ...register(name),
        className:
            "mt-2 w-full rounded-2xl border border-white/10 bg-[#060B16]/60 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10",
    });
    return (
        <MarketingShell>
            <section className="mx-auto max-w-5xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
                <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                    Hubungi AsetKita
                </p>
                <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Mari membangun langkah finansial{" "}
                    <span className="text-cyan-400">yang lebih cerdas.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl leading-8 text-slate-300">
                    Punya pertanyaan atau ingin berbagi masukan? Sampaikan kepada kami dan
                    tim AsetKita akan merespons maksimal dalam 24 jam.
                </p>
            </section>
            <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8 lg:pb-24">
                <aside className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        {details.map(({ title, value, note, icon: Icon, href }) => (
                            <a
                                key={title}
                                href={href}
                                className="rounded-[1.5rem] border border-white/10 bg-[#111827]/80 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/35"
                            >
                                <Icon className="text-cyan-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">{title}</p>
                                <p className="mt-1 text-sm font-medium text-cyan-100">
                                    {value}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">{note}</p>
                            </a>
                        ))}
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#111827]/80 p-5">
                        <p className="text-sm font-semibold text-white">Ikuti AsetKita</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {socialLinks.map(({ label, icon: Icon }) => (
                                <a
                                    key={label}
                                    href="#media-sosial"
                                    aria-label={label}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/35 hover:text-cyan-300"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                </aside>
                <div
                    id="form-kontak"
                    className="rounded-[2rem] border border-white/10 bg-[#111827]/80 p-6 shadow-[0_0_70px_rgba(15,23,42,.28)] sm:p-8"
                >
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[.25em] text-cyan-300">
                            Kirim pesan
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-white">
                            Kami senang mendengar dari Anda.
                        </h2>
                    </div>
                    <form
                        className="mt-7 space-y-5"
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Nama" error={errors.name?.message}>
                                <input placeholder="Nama lengkap Anda" {...field("name")} />
                            </Field>
                            <Field label="Email" error={errors.email?.message}>
                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    {...field("email")}
                                />
                            </Field>
                        </div>
                        <Field label="Subjek" error={errors.subject?.message}>
                            <input
                                placeholder="Ceritakan kebutuhan Anda"
                                {...field("subject")}
                            />
                        </Field>
                        <Field label="Pesan" error={errors.message?.message}>
                            <textarea
                                rows={6}
                                placeholder="Tulis pesan Anda di sini..."
                                {...field("message")}
                                className={`${field("message").className} resize-y`}
                            />
                        </Field>
                        {status === "success" && (
                            <p
                                role="status"
                                className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                            >
                                Pesan Anda sudah terkirim. Tim kami akan segera menghubungi
                                Anda.
                            </p>
                        )}
                        {status === "error" && (
                            <p
                                role="alert"
                                className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
                            >
                                Pesan belum dapat dikirim. Silakan coba lagi beberapa saat lagi.
                            </p>
                        )}
                        <button
                            disabled={isSubmitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                "Mengirim pesan..."
                            ) : (
                                <>
                                    Kirim Pesan <Send size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </section>
            <section
                id="lokasi"
                className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24"
            >
                <div className="relative min-h-72 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#0B1220] p-6 sm:p-10">
                    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.15)_1px,transparent_1px)] [background-size:42px_42px]" />
                    <div className="relative flex min-h-56 items-center justify-center">
                        <div className="max-w-sm rounded-[1.5rem] border border-white/15 bg-[#111827]/90 p-6 text-center shadow-[0_0_60px_rgba(34,211,238,.14)]">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                                <MapPin />
                            </span>
                            <p className="mt-4 font-semibold text-white">Kantor AsetKita</p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                SCBD, Jakarta Selatan
                                <br />
                                Jakarta 12190, Indonesia
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-300">
                                Placeholder peta lokasi <ExternalLink size={13} />
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-[.3em] text-cyan-300">
                        FAQ singkat
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold text-white">
                        Sebelum mengirim pesan.
                    </h2>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                        [
                            "Kapan saya menerima respons?",
                            "Tim kami berupaya membalas setiap pesan maksimal dalam 24 jam kerja.",
                        ],
                        [
                            "Apakah saya perlu punya akun?",
                            "Tidak. Anda tetap dapat menghubungi kami untuk pertanyaan umum.",
                        ],
                    ].map(([q, a]) => (
                        <div
                            key={q}
                            className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6"
                        >
                            <h3 className="font-medium text-white">{q}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-400">{a}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/15 via-[#111827] to-teal-500/15 px-6 py-12 text-center">
                    <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                        Mulai perjalanan aset Anda hari ini.
                    </h2>
                    <p className="mt-4 text-slate-300">
                        Satu dashboard yang membantu Anda melihat setiap langkah dengan
                        lebih jelas.
                    </p>
                    <Link
                        to="/register"
                        className="mt-7 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                        Mulai Sekarang
                    </Link>
                </div>
            </section>
        </MarketingShell>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm font-medium text-slate-200">
            {label}
            {children}
            {error && (
                <span className="mt-2 block text-xs text-rose-300">{error}</span>
            )}
        </label>
    );
}
