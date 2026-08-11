import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import { ensureTesterAccount } from "@/services/authService";

function App() {
    useEffect(() => {
        ensureTesterAccount().catch((err) => {
            console.warn("Auto-login tester account error:", err);
        });
    }, []);

    return <AppRouter />;
}

export default App;