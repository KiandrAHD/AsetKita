import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "@/pages/Landing/Landing";
import About from "@/pages/Landing/about";
import Security from "@/pages/Security/security";
import Contact from "@/pages/Contact/contact";

import Login from "@/pages/Login/login";
import Register from "@/pages/Register/register";
import Demo from "@/pages/Demo/demo";

import Dashboard from "@/pages/Dashboard/dashboard";
import Portfolio from "@/pages/Portfolio/portfolio";
import Market from "@/pages/Market/market";
import AI from "@/pages/AI/ai";
import Profile from "@/pages/Profile/profile";
import Settings from "@/pages/Settings/settings";
import Notification from "@/pages/Notification/notification";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/security" element={<Security />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/demo" element={<Demo />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/market" element={<Market />} />
                <Route path="/ai" element={<AI />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notification" element={<Notification />} />

            </Routes>
        </BrowserRouter>
    );
}