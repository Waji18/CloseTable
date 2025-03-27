export const uploadImage = async (file, restaurantId) => {
  try {
    if (file.size > MAX_FILE_SIZE) throw "File too large (max 5MB)";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurant_id", restaurantId);

    const response = await api.post("/api/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.file_id;
  } catch (error) {
    throw error.response?.data?.error || "Image upload failed";
  }
};

export const deleteImage = async (fileId) => {
  try {
    await api.delete(`/api/images/${fileId}`);
  } catch (error) {
    throw error.response?.data?.error || "Image deletion failed";
  }
};
