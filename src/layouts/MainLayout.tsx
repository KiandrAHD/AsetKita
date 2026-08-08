import { Outlet } from "react-router-dom";

function MainLayout() {
    return (
        <>
            {/* Navbar */}

            <Outlet />

            {/* Footer */}
        </>
    );
}

export default MainLayout;
