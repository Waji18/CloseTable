import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Add JWT to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: async (credentials) => {
    try {
      const { data } = await api.post("/api/login", credentials);
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      return data.user;
    } catch (error) {
      throw error.response?.data?.error || "Login failed";
    }
  },

  signup: async (userData) => {
    try {
      const { data } = await api.post("/api/signup", {
        ...userData,
        role: "Customer", // Force default role
      });
      return data;
    } catch (error) {
      throw error.response?.data?.error || "Registration failed";
    }
  },

  upgradeToOwner: async () => {
    try {
      const { data } = await api.put("/api/users/role", {
        role: "Restaurant Owner",
      });
      return data.user;
    } catch (error) {
      throw error.response?.data?.error || "Role upgrade failed";
    }
  },

  logout: async () => {
    try {
      await api.post("/api/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  getProfile: async () => {
    try {
      const { data } = await api.get("/api/profile");
      return data;
    } catch (error) {
      throw error.response?.data?.error || "Failed to fetch profile";
    }
  },
};
