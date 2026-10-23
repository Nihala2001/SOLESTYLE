
import api from "../axiosInstance";

/* Get sales report with optional date filters */
export const getSalesReport = async (filters = {}) => {
    const response = await api.get("/admin/sales-report", {
        params: filters,
    });

    return response.data;
};
