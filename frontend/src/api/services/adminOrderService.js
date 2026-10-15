import api from "../axiosInstance";

// Get all orders with optional search, status filter, and pagination
export const getAllOrders = async (params = {}) => {
const response = await api.get("/admin/orders", { params });
return response.data;
};

// Get one order's details
export const getOrderById = async (orderId) => {
const response = await api.get(`/admin/orders/${orderId}`);
return response.data;
};

// Update order status
export const updateOrderStatus = async (orderId, orderStatus) => {
const response = await api.patch(`/admin/orders/${orderId}/status`, {
orderStatus,
});
return response.data;
};


export const updatePaymentStatus = async (orderId, paymentStatus) => {
    const response = await api.patch(
        `/admin/orders/${orderId}/payment-status`,
        { paymentStatus }
    );
    return response.data;
};
export const getReturnExchangeRequests = async () => {
    const response = await api.get("/admin/orders/returns");
    return response.data;
};

export const updateReturnExchangeStatus = async (
    orderId,
    itemIndex,
    status
) => {
    const response = await api.patch(
        `/admin/orders/returns/${orderId}/${itemIndex}`,
        { status }
    );
    return response.data;
};