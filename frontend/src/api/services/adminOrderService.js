
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

// Update overall order status (retain for existing workflows)
export const updateOrderStatus = async (orderId, orderStatus) => {
    const response = await api.patch(
        `/admin/orders/${orderId}/status`,
        { orderStatus }
    );

    return response.data;
};

// Update one product's delivery status
export const updateOrderItemStatus = async (
    orderId,
    itemId,
    status
) => {
    const response = await api.patch(
        `/admin/orders/${orderId}/items/${itemId}/status`,
        { status }
    );

    return response.data;
};

// Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus) => {
    const response = await api.patch(
        `/admin/orders/${orderId}/payment-status`,
        { paymentStatus }
    );

    return response.data;
};

// Get all return and exchange requests
export const getReturnExchangeRequests = async () => {
    const response = await api.get("/admin/orders/returns");
    return response.data;
};

// Update a specific return/exchange request using its request ID
export const updateReturnExchangeStatus = async (
    orderId,
    requestId,
    status
) => {
    const response = await api.patch(
        `/admin/orders/returns/${orderId}/${requestId}`,
        { status }
    );

    return response.data;
};
