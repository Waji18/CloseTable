export const createReservation = async (data) => {
  try {
    const response = await api.post("/api/reservations", {
      ...data,
      datetime: new Date(data.datetime).toISOString(),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error("Invalid reservation data");
    }
    throw new Error("Reservation failed");
  }
};

export const updateReservationStatus = async (id, status) => {
  try {
    const response = await api.put(`/api/reservations/${id}`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Update failed");
  }
};

export const getUserReservations = async () => {
  try {
    const response = await api.get("/api/reservations");
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to fetch reservations";
  }
};
