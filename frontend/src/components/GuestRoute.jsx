
import { Navigate, Outlet } from "react-router-dom";

const GuestRoute = () => {
    const userToken = localStorage.getItem("userToken");

    if (userToken) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
};

export default GuestRoute;
