import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import { ensureTesterAccount } from "@/services/authService";

function App() {
    useEffect(() => {
        void ensureTesterAccount();
    }, []);

    return <AppRouter />;
}

export default App;