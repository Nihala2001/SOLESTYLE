
import api from "../axiosInstance";

/* Get reviews and average rating for a product */
export const getProductReviews = async (productId) => {
    const response = await api.get(
        `/reviews/product/${productId}`
    );

    return response.data;
};

/* Submit a review for a delivered product */
export const createReview = async (reviewData) => {
    const response = await api.post("/reviews", reviewData);

    return response.data;
};

/* Get reviews submitted by the logged-in customer */
export const getMyReviews = async () => {
    const response = await api.get("/reviews/my-reviews");

    return response.data;
};


/* Delete a review owned by the logged-in customer */
export const deleteMyReview = async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
};
