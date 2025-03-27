export const getPendingRestaurants = async () => {
  try {
    const response = await api.get("/api/admin/restaurants?status=pending");
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to fetch pending restaurants";
  }
};

export const approveRestaurant = async (id, notes = "") => {
  try {
    const response = await api.put(`/api/admin/restaurants/${id}/approve`, {
      notes,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Approval failed";
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    const response = await api.put(`/api/admin/users/${userId}/role`, {
      role: newRole,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Role update failed";
  }
};
