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
