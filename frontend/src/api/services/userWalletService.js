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
