import api from "../axiosInstance";

export const getAdminOffers = async (search = "", page = 1, limit = 5) => {
  const response = await api.get("/admin/offers", {
    params: { search, page, limit },
  });
  return response.data;
};

export const addAdminOffer = async (data) => {
  const response = await api.post("/admin/offers", data);
  return response.data;
};

export const updateAdminOffer = async (offerId, data) => {
  const response = await api.put(`/admin/offers/${offerId}`, data);
  return response.data;
};

export const deactivateAdminOffer = async (offerId) => {
  const response = await api.patch(`/admin/offers/${offerId}/deactivate`);
  return response.data;
};

export const activateAdminOffer = async (offerId) => {
  const response = await api.patch(`/admin/offers/${offerId}/activate`);
  return response.data;
};
