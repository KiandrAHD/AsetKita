import { useEffect, useState } from "react";
import PageFrame from "@/components/Dashboard/PageFrame";
import { auth } from "@/lib/firebase";
import { getDashboardData } from "@/services/dashboardService";
import { updateProfile } from "@/services/accountService";
import { getDemoSession } from "@/services/demoService";

export default function Profile() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState("");
  const [message, setMessage] = useState("");
  const demo = Boolean(getDemoSession());
  useEffect(() => {
    void getDashboardData(auth.currentUser?.uid).then((data) => {
      setName(data.profile.name);
      setPhone(data.profile.phone ?? "");
      setEmail(data.profile.email ?? auth.currentUser?.email ?? "");
      setJoined(
        data.profile.joinedAt?.toLocaleDateString("id-ID") ?? "Sesi demo",
      );
    });
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (demo) return setMessage("Profil akun demo tidak disimpan.");
    try {
      await updateProfile({ namaPanggilan: name, nomorHP: phone });
      setMessage("Profil berhasil diperbarui.");
    } catch {
      setMessage("Profil gagal diperbarui.");
    }
  };
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
              {demo ? "demo" : auth.currentUser?.uid}
            </b>
          </p>
          <p className="text-slate-400">
            Bergabung <b className="ml-2 text-white">{joined}</b>
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
