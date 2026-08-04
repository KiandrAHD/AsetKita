import { BrowserRouter, Route, Routes } from "react-router-dom";

import Landing from "@/pages/Landing/landing";
import About from "@/pages/Landing/about";
import Security from "@/pages/Landing/security";
import Contact from "@/pages/Landing/contact";
import Faq from "@/pages/Landing/faq";

import Login from "@/pages/Login_Register_Demo/login";
import Register from "@/pages/Login_Register_Demo/register";
import Demo from "@/pages/Login_Register_Demo/demo";

import Dashboard from "@/pages/Dashboard/dashboard";
import Portfolio from "@/pages/Dashboard/portofolio";
import Market from "@/pages/Dashboard/market";
import Profile from "@/pages/Dashboard/profile";
import Settings from "@/pages/Dashboard/settings";
import Notification from "@/pages/Dashboard/notification";
import RequireAuth from "@/components/auth/RequireAuth";

const AI = () => <div>AI Page</div>;

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/security" element={<Security />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<Faq />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/demo" element={<Demo />} />

                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />
                <Route path="/market" element={<RequireAuth><Market /></RequireAuth>} />
                <Route path="/ai" element={<RequireAuth><AI /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/notification" element={<RequireAuth><Notification /></RequireAuth>} />

            </Routes>
        </BrowserRouter>
    );
}
