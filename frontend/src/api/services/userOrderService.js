
import api from "../axiosInstance";



export const createOrder = async (
    addressId,
    paymentMethod,
    couponCode = null,
) => {
    const response = await api.post("/orders", {
        addressId,
        paymentMethod,
        couponCode,
    });

    return response.data;
};


export const getMyOrders = async () => {
    const response = await api.get("/orders/my-orders");
    return response.data;
};


export const requestReturnExchange = async (
    orderId,
    itemIndex,
    type,
    reason,
    replacementVariantId = null,
) => {
    const response = await api.post("/orders/return-exchange", {
        orderId,
        itemIndex,
        type,
        reason,
        replacementVariantId:
            type === "Exchange" ? replacementVariantId : null,
    });

    return response.data;
};

// Cancel order
export const cancelOrder = async (orderId) => {
    const response = await api.patch("/orders/cancel", {
        orderId,
    });

    return response.data;
};
