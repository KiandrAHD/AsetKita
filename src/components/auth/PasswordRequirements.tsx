import { Check } from "lucide-react";
import { passwordRules } from "@/utils/authValidation";
export default function PasswordRequirements({ password }: { password: string }) { return <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400 sm:grid-cols-2">{passwordRules(password).map((rule) => <p key={rule.label} className={rule.valid ? "text-emerald-300" : ""}><Check className="mr-2 inline-block" size={14} />{rule.label}</p>)}</div>; }
