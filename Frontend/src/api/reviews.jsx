export const submitReview = async (restaurantId, reviewData) => {
  try {
    const response = await api.post(`/api/reviews`, {
      ...reviewData,
      restaurantId,
      comment: sanitize(reviewData.comment), // Use your sanitize function
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Review submission failed";
  }
};

export const getRestaurantReviews = async (restaurantId) => {
  try {
    const response = await api.get(
      `/api/reviews?restaurant_id=${restaurantId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to fetch reviews";
  }
};
