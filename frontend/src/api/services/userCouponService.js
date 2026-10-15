import api from "../axiosInstance";

export const getAvailableCoupons = async () => {
const response = await api.get("/user/coupons");
return response.data;
};
