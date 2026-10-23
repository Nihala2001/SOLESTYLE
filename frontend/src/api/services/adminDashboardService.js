
import api from "../axiosInstance";

export const getDashboardData = async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
};

export const getDashboardSalesReport = async (filters = {}) => {
    const response = await api.get("/admin/sales-report", {
        params: filters,
    });
    return response.data;
};
