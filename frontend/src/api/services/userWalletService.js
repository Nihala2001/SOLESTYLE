import api from "../axiosInstance";

// Fetch the logged-in customer's wallet balance.
export const getWallet = async () => {
  const response = await api.get("/wallet");
  return response.data;
};

// Fetch the customer's wallet transaction history.
export const getWalletTransactions = async () => {
  const response = await api.get("/wallet/transactions");
  return response.data;
};

export const createWalletTopUp = async (amount) => {
  const response = await api.post("/wallet/top-up/create", { amount });
  return response.data;
};

export const verifyWalletTopUp = async (paymentDetails) => {
  const response = await api.post("/wallet/top-up/verify", paymentDetails);
  return response.data;
};
