
import api from "../axiosInstance";

export const getAdminReviews = async (filters = {}) => {
    const response = await api.get("/admin/reviews", {
        params: filters,
    });

    return response.data;
};

export const deleteAdminReview = async (reviewId) => {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
};

export const updateReviewVisibility = async (reviewId, isHidden) => {
    const response = await api.patch(
        `/admin/reviews/${reviewId}/visibility`,
        { isHidden }
    );

    return response.data;
};

export const saveAdminReviewReply = async (reviewId, reply) => {
    const response = await api.patch(
        `/admin/reviews/${reviewId}/reply`,
        { reply }
    );

    return response.data;
};
