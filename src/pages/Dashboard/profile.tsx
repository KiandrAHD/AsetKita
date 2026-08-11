import { useEffect, useState } from "react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { auth } from "@/lib/firebase";
import { getDashboardData } from "@/services/dashboardService";
import { updateProfile } from "@/services/accountService";
import { getDemoSession, saveDemoSession } from "@/services/demoService";
import type { LocalAccount } from "@/services/authService";

export default function Profile() {
  const session = getDemoSession();
  const isDemo = session?.isDemo ?? true;
  const [name, setName] = useState(session?.nickname ?? "");
  const [phone, setPhone] = useState(session?.nomorHP ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [joined, setJoined] = useState(isDemo ? "Sesi demo" : "Terdaftar");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getDashboardData(auth.currentUser?.uid).then((data) => {
      if (data.profile.name) setName(data.profile.name);
      if (data.profile.phone) setPhone(data.profile.phone);
      if (data.profile.email) setEmail(data.profile.email);
      if (data.profile.joinedAt) {
        setJoined(data.profile.joinedAt.toLocaleDateString("id-ID"));
      }
    });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isDemo) return setMessage("Profil akun demo tidak disimpan.");
    try {
      if (session) {
        saveDemoSession({ ...session, nickname: name, nomorHP: phone });
        const localAccountsStr = localStorage.getItem("asetkita-local-accounts");
        if (localAccountsStr) {
          try {
            const accounts: LocalAccount[] = JSON.parse(localAccountsStr);
            const idx = accounts.findIndex(
              (a) => a.email.toLowerCase() === session.email?.toLowerCase()
            );
            if (idx !== -1) {
              accounts[idx].namaPanggilan = name;
              accounts[idx].nomorHP = phone;
              localStorage.setItem("asetkita-local-accounts", JSON.stringify(accounts));
            }
          } catch {
            // ignore
          }
        }
      }
      try {
        await updateProfile({ namaPanggilan: name, nomorHP: phone });
      } catch {
        // cloud function fallback ignored
      }
      setMessage("Profil berhasil diperbarui.");
    } catch {
      setMessage("Profil gagal diperbarui.");
    }
  };

  const uidDisplay = isDemo
    ? "demo"
    : auth.currentUser?.uid ?? (session?.email ? `usr_${session.email.split("@")[0]}` : "member");

  return (
    <PageFrame title="Profil" description="Kelola informasi akun Anda.">
      <form
        onSubmit={(event) => void submit(event)}
        className="max-w-2xl space-y-5 rounded-2xl border border-white/10 bg-[#101b2a] p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Nama panggilan
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3 outline-none"
            />
          </label>
          <label className="text-sm">
            Nomor HP
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+628..."
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3 outline-none"
            />
          </label>
        </div>
        <label className="block text-sm text-slate-400">
          Email
          <input
            disabled
            value={email}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3"
          />
        </label>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <p className="text-slate-400">
            UID{" "}
            <b className="ml-2 break-all text-white">
              {uidDisplay}
            </b>
          </p>
          <p className="text-slate-400">
            Status <b className="ml-2 text-white">{joined}</b>
          </p>
        </div>
        {message && <p className="text-sm text-cyan-200">{message}</p>}
        <button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950">
          Simpan perubahan
        </button>
      </form>
    </PageFrame>
  );
}
