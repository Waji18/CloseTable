import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const userData = await authAPI.login(credentials);
      setUser(userData);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      await authAPI.signup(userData);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const upgradeRole = async () => {
    try {
      const updatedUser = await authAPI.upgradeToOwner();
      setUser(updatedUser);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    upgradeRole,
    isCustomer: user?.role === "Customer",
    isOwner: user?.role === "Restaurant Owner",
    isAdmin: user?.role === "Admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
