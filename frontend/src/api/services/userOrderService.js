
import api from "../axiosInstance";

export const createOrder = async (addressId, paymentMethod) => {
  const response = await api.post("/orders", {
    addressId,
    paymentMethod,
  });

  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/orders/my-orders");
  return response.data;
};