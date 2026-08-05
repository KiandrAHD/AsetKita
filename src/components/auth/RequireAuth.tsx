import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { getDemoSession } from "@/services/demoService";

export default function RequireAuth({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);
    useEffect(() => onAuthStateChanged(auth, (user) => { setSignedIn(Boolean(user)); setReady(true); }), []);
    if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[#060B16] text-sm text-cyan-300">Menyiapkan sesi aman...</div>;
    return signedIn || Boolean(getDemoSession()) ? children : <Navigate to="/login" replace />;
}
