export const createMenuItem = async (data) => {
  try {
    const response = await api.post("/api/menu-items", {
      ...data,
      price: parseFloat(data.price),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Permission denied");
    }
    throw new Error("Menu item creation failed");
  }
};

export const deleteMenuItem = async (id) => {
  try {
    await api.delete(`/api/menu-items/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.error || "Deletion failed");
  }
};
export const getMenu = async (restaurantId) => {
  try {
    const response = await api.get(
      `/api/menu-items?restaurant_id=${restaurantId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to fetch menu";
  }
};
