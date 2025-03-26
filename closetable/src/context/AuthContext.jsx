// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/index";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
  const navigate = useNavigate();

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post("/api/login", { email, password });
      setTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expiryDate: Date.now() + 15 * 60 * 1000,
      });

      setUser({
        id: response.data.user.id,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        email: response.data.user.email,
        role: response.data.user.role,
      });

      localStorage.setItem(
        "authState",
        JSON.stringify({
          user: {
            id: response.data.user.id,
            first_name: response.data.user.first_name,
            last_name: response.data.user.last_name,
            email: response.data.user.email,
            role: response.data.user.role,
          },
          tokens: {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expiryDate: Date.now() + 15 * 60 * 1000,
          },
        })
      );
      navigate("/");
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post("/api/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem("authState");
      navigate("/login");
    }
  };

  // Token refresh logic
  useEffect(() => {
    let refreshInterval;
    if (tokens && tokens.access_token && tokens.refresh_token) {
      const decodeToken = (token) => {
        try {
          return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
          return null;
        }
      };

      const accessToken = tokens.access_token;
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000;
        const timeUntilExpiration = expirationTime - Date.now() - 60000;

        if (timeUntilExpiration > 0) {
          refreshInterval = setInterval(() => {
            refreshTokens();
          }, timeUntilExpiration);
        }
      }
    }
    return () => clearInterval(refreshInterval);
  }, [tokens]);

  const refreshTokens = async () => {
    try {
      const response = await api.post(
        "/api/refresh",
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.refresh_token}`,
          },
        }
      );
      setTokens({
        access_token: response.data.access_token,
        refresh_token: tokens.refresh_token,
        expiryDate: Date.now() + 15 * 60 * 1000,
      });
      localStorage.setItem(
        "authState",
        JSON.stringify({
          user,
          tokens: {
            access_token: response.data.access_token,
            refresh_token: tokens.refresh_token,
            expiryDate: Date.now() + 15 * 60 * 1000,
          },
        })
      );
    } catch (error) {
      logout();
    }
  };

  // Initial auth check
  useEffect(() => {
    const savedAuthState = localStorage.getItem("authState");
    if (savedAuthState) {
      try {
        const parsedAuthState = JSON.parse(savedAuthState);
        if (Date.now() < parsedAuthState.tokens.expiryDate) {
          setTokens(parsedAuthState.tokens);
          setUser(parsedAuthState.user);
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${parsedAuthState.tokens.access_token}`;
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  // Set auth header
  useEffect(() => {
    if (tokens && tokens.access_token) {
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${tokens.access_token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [tokens]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
