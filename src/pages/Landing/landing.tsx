export default function Landing() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-white/10 backdrop-blur-lg bg-[#030712]/80 z-50">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

          <h1 className="text-2xl font-bold">
            Aset<span className="text-cyan-400">Kita</span>
          </h1>

          <div className="hidden gap-8 md:flex">
            <a href="#" className="hover:text-cyan-400 transition">Home</a>
            <a href="#" className="hover:text-cyan-400 transition">About</a>
            <a href="#" className="hover:text-cyan-400 transition">Features</a>
            <a href="#" className="hover:text-cyan-400 transition">Security</a>
            <a href="#" className="hover:text-cyan-400 transition">Contact</a>
          </div>

          <button className="rounded-xl bg-cyan-500 px-5 py-2 hover:bg-cyan-400 transition">
            Login
          </button>

        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-8">

        <div className="grid w-full gap-16 lg:grid-cols-2">

          {/* Left */}
          <div className="flex flex-col justify-center">

            <span className="mb-5 w-fit rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              🚀 Smart Investment Platform
            </span>

            <h1 className="text-6xl font-bold leading-tight">
              Kelola Semua
              <br />
              Investasi
              <br />
              <span className="text-cyan-400">
                Dalam Satu Platform
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-gray-300">
              AsetKita membantu mengelola aset,
              investasi, serta memberikan analisis AI
              agar keputusan finansial menjadi lebih
              mudah dan cerdas.
            </p>

            <div className="mt-10 flex gap-5">

              <button className="rounded-xl bg-cyan-500 px-7 py-4 font-semibold hover:bg-cyan-400 transition">
                Mulai Sekarang
              </button>

              <button className="rounded-xl border border-white/20 px-7 py-4 hover:bg-white/10 transition">
                Demo
              </button>

            </div>

          </div>

          {/* Right */}
          <div className="flex items-center justify-center">

            <div className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-[#111827] p-8 shadow-2xl">

              <h2 className="mb-6 text-2xl font-bold">
                Dashboard Preview
              </h2>

              <div className="mb-5 rounded-2xl bg-[#1F2937] p-5">

                <p className="text-sm text-gray-400">
                  Total Asset
                </p>

                <h1 className="mt-2 text-3xl font-bold">
                  Rp120.000.000
                </h1>

                <p className="mt-2 text-green-400">
                  ▲ +8.52%
                </p>

              </div>

              <div className="space-y-4">

                <div className="flex justify-between rounded-xl bg-[#1F2937] p-4">
                  <span>Bitcoin</span>
                  <span>Rp18.000.000</span>
                </div>

                <div className="flex justify-between rounded-xl bg-[#1F2937] p-4">
                  <span>BBCA</span>
                  <span>Rp25.000.000</span>
                </div>

                <div className="flex justify-between rounded-xl bg-[#1F2937] p-4">
                  <span>Emas</span>
                  <span>Rp12.500.000</span>
                </div>

              </div>

              <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">

                <p className="font-semibold text-cyan-300">
                  AI Assistant
                </p>

                <p className="mt-2 text-sm text-gray-300">
                  Portofolio kamu stabil hari ini.
                  AI menyarankan mempertahankan
                  komposisi aset saat ini.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}