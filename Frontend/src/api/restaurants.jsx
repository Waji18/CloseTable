export const createRestaurant = async (data) => {
  try {
    const response = await api.post("/api/restaurants", data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Restaurant creation failed";
  }
};

export const getRestaurants = async (filters = {}) => {
  try {
    const response = await api.get("/api/restaurants", { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to fetch restaurants";
  }
};

export const updateRestaurant = async (id, updates) => {
  try {
    const response = await api.put(`/api/restaurants/${id}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Update failed";
  }
};

export const deleteRestaurant = async (id) => {
  try {
    await api.delete(`/api/restaurants/${id}`);
  } catch (error) {
    throw error.response?.data?.error || "Deletion failed";
  }
};
