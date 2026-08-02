import { useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";

const stats = [
  { value: "50K+", label: "Investor aktif" },
  { value: "10K+", label: "Insight AI harian" },
  { value: "$2.8B", label: "Aset terpantau" },
  { value: "99.9%", label: "Jaminan uptime" },
];

const features = [
  {
    title: "Asisten Investasi AI",
    description: "Dapatkan arahan yang disesuaikan untuk pergeseran portofolio, keseimbangan risiko, dan perencanaan jangka panjang.",
    icon: Bot,
  },
  {
    title: "Analisis Real-Time",
    description: "Pantau performa di berbagai pasar dengan insight langsung dan sinyal pasar yang cepat.",
    icon: TrendingUp,
  },
  {
    title: "Keamanan Setara Perbankan",
    description: "Lindungi aset Anda dengan infrastruktur yang mengutamakan privasi dan perlindungan berkelanjutan.",
    icon: ShieldCheck,
  },
  {
    title: "Portofolio Pintar",
    description: "Diversifikasi dengan rekomendasi alokasi cerdas yang disesuaikan dengan target Anda.",
    icon: Sparkles,
  },
  {
    title: "Eksekusi Instan",
    description: "Bertindak dengan percaya diri melalui proses eksekusi yang lancar dan cepat.",
    icon: ArrowRight,
  },
  {
    title: "Pusat Pembelajaran",
    description: "Pelajari konsep pasar, strategi investasi, dan kerangka keputusan berbasis AI.",
    icon: ChevronRight,
  },
];

const checklist = [
  "Skor kesehatan portofolio",
  "Peringatan risiko real-time",
  "Insight pasar yang personal",
];

const faqs = [
  {
    question: "Bagaimana asisten AI membantu keputusan investasi?",
    answer:
      "Asisten AI menggabungkan sinyal pasar, perilaku portofolio, dan target Anda untuk menyarankan langkah yang lebih cerdas sebelum volatilitas datang.",
  },
  {
    question: "Apakah data saya aman di setiap langkah?",
    answer:
      "Tentu. Setiap lapisan dilengkapi dengan kontrol akses ketat, penyimpanan terenkripsi, dan pemantauan keamanan yang berkelanjutan.",
  },
  {
    question: "Apakah AsetKita cocok untuk pemula dan investor berpengalaman?",
    answer:
      "Sangat cocok. Platform ini mendukung pembelajaran yang mudah dipahami, alur kerja yang sederhana, dan analitik canggih untuk kebutuhan profesional.",
  },
  {
    question: "Seberapa cepat saya bisa mulai?",
    answer:
      "Anda bisa membuat akun, menghubungkan dashboard, dan mulai menerima insight dalam hitungan menit.",
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030712] text-slate-100">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-80 w-80 rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[180px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
              A
            </span>
            <span>
              Aset<span className="text-cyan-400">Kita</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            {[
              ["Home", "#home"],
              ["About Us", "#about"],
              ["Security", "#security"],
              ["FAQ", "#faq"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="transition hover:text-cyan-300">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#contact"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Masuk
            </a>
            <a
              href="#about"
              className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Mulai Sekarang
            </a>
          </div>

          <button
            type="button"
            className="rounded-full border border-white/15 p-2 text-slate-200 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-[#030712]/95 px-4 py-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-3 text-sm text-slate-300">
              {[
                ["Home", "#home"],
                ["About Us", "#about"],
                ["Security", "#security"],
                ["FAQ", "#faq"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="rounded-2xl border border-white/10 px-4 py-3 transition hover:border-cyan-400/40 hover:text-cyan-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main id="home">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid w-full gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
                <Sparkles size={16} />
                Platform Investasi Berbasis AI
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-7xl">
                Kelola Aset Anda
                <span className="block text-cyan-400">Lebih Cerdas Bersama AI</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Kelola seluruh investasi Anda dalam satu platform modern dengan analisis real-time, kecerdasan buatan, dan keamanan tingkat tinggi untuk membantu pertumbuhan aset Anda.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Lihat Dashboard
                </a>
                <a
                  href="#security"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  Pelajari Keamanan
                </a>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-emerald-500/10 to-transparent blur-3xl" />
              <div className="relative w-full max-w-xl rounded-[2rem] border border-cyan-400/20 bg-[#0c1427]/90 p-5 shadow-[0_0_80px_rgba(34,211,238,0.16)] backdrop-blur-xl sm:p-8">
                <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total nilai portofolio</p>
                      <p className="mt-2 text-3xl font-semibold text-white">Rp 284 juta</p>
                    </div>
                    <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-400">
                      +8.52%
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ["BTC", "$48.2K"],
                      ["ETH", "$24.1K"],
                      ["Gold", "$18.9K"],
                    ].map(([asset, value]) => (
                      <div key={asset} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{asset}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
                      <Bot size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">AsetKita AI</p>
                      <p className="text-sm text-slate-400">Portofolio Anda seimbang hari ini</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    Aset Anda saat ini berada dalam kisaran risiko yang sehat. Penyesuaian kecil ke instrumen yang lebih defensif dapat memperkuat ketahanan minggu ini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_0_60px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-6 text-center">
                <p className="text-3xl font-semibold text-white sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-4 text-center sm:text-left">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Fitur</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Semua yang Anda Butuhkan untuk Berinvestasi Lebih Cerdas
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="group rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-7 shadow-[0_0_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_100px_rgba(34,211,238,0.2)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-cyan-300">
                    Jelajahi sekarang
                    <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 rounded-[2.25rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_80px_rgba(34,197,94,0.08)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">AI</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Perkuat setiap keputusan dengan asisten cerdas yang selalu siap
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                Dari pemantauan portofolio hingga arahan proaktif, AsetKita menggabungkan insight yang jelas dengan otomatisasi yang ringan agar Anda selalu tahu langkah terbaik berikutnya.
              </p>
              <ul className="mt-7 space-y-3">
                {checklist.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <Check size={16} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Coba AI Sekarang
              </a>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-5 shadow-[0_0_80px_rgba(34,211,238,0.12)] sm:p-7">
              <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                      <Bot size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">AsetKita Assistant</p>
                      <p className="text-sm text-slate-400">Online now</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Live
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/10 p-3 text-sm text-slate-200">
                    Saya menilai portofolio Anda belum seimbang antara kas dan aset pertumbuhan.
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-cyan-500/20 p-3 text-sm text-cyan-100">
                    Sarankan langkah terbaik untuk hari ini.
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/10 p-3 text-sm text-slate-200">
                    Alokasikan kembali 8% ke dana pertumbuhan yang terdiversifikasi sambil menjaga likuiditas tetap sehat.
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3">
                  <input
                    type="text"
                    placeholder="Tanyakan kepada AI Anda"
                    className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  />
                  <button className="rounded-full bg-cyan-500 p-2 text-slate-950 transition hover:bg-cyan-400" aria-label="Send message">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Pertanyaan yang Sering Diajukan</h2>
          </div>

          <div className="mx-auto mt-10 max-w-4xl space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="rounded-[1.25rem] border border-white/10 bg-white/5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-medium text-white">{faq.question}</span>
                    <ChevronDown size={18} className={`text-cyan-300 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen ? <p className="px-6 pb-6 text-sm leading-7 text-slate-400">{faq.answer}</p> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-slate-900/80 to-emerald-500/20 px-6 py-12 shadow-[0_0_100px_rgba(34,211,238,0.12)] sm:px-10 lg:px-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Siap mengelola investasi dengan lebih cerdas?</p>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                  Bergabunglah bersama ribuan investor yang mempercayakan portofolio mereka kepada AsetKita.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="#home" className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Mulai Sekarang
                </a>
                <a href="#faq" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-300">
                  Lihat FAQ
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#030712]/90 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <a href="#home" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                A
              </span>
              <span>
                Aset<span className="text-cyan-400">Kita</span>
              </span>
            </a>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Platform investasi modern yang fokus pada kejelasan, kecerdasan, dan pertumbuhan jangka panjang.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Perusahaan</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><a className="transition hover:text-cyan-300" href="#about">Tentang</a></li>
                <li><a className="transition hover:text-cyan-300" href="#contact">Kontak</a></li>
                <li><a className="transition hover:text-cyan-300" href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Legal</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><a className="transition hover:text-cyan-300" href="#">Kebijakan Privasi</a></li>
                <li><a className="transition hover:text-cyan-300" href="#">Syarat & Ketentuan</a></li>
                <li><a className="transition hover:text-cyan-300" href="#">Keamanan</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Sosial</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><a className="transition hover:text-cyan-300" href="#">X / Twitter</a></li>
                <li><a className="transition hover:text-cyan-300" href="#">LinkedIn</a></li>
                <li><a className="transition hover:text-cyan-300" href="#">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AsetKita. Semua hak dilindungi.</p>
          <p>Dibangun untuk investor modern yang mengutamakan kejelasan dan kecepatan.</p>
        </div>
      </footer>
    </div>
  );
}