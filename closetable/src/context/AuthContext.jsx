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

  // Google login function
  const googleLogin = async (googleUser) => {
    try {
      const response = await api.post("/api/auth/google", {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
      });

      setTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expiryDate: Date.now() + 15 * 60 * 1000,
      });
      setUser({
        id: response.data.user.id,
        name: response.data.user.username,
        email: response.data.user.email,
        role: response.data.user.role,
      });
      localStorage.setItem(
        "authState",
        JSON.stringify({
          user: {
            id: response.data.user.id,
            name: response.data.user.username,
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
      console.error("Google login failed:", error);
      throw error;
    }
  };

  // Existing login function
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
        name: response.data.user.username,
        email: response.data.user.email,
        role: response.data.user.role,
      });
      localStorage.setItem(
        "authState",
        JSON.stringify({
          user: {
            id: response.data.user.id,
            name: response.data.user.username,
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

  // Existing logout function
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

  // Refresh token functionality remains the same
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
        const timeUntilExpiration = expirationTime - Date.now() - 60000; // Refresh 1 minute before expiry

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

  // Check for existing auth state on app load
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

  // Add token to API requests
  useEffect(() => {
    if (tokens && tokens.access_token) {
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${tokens.access_token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [tokens]);

  // Idle timeout functionality
  useEffect(() => {
    let idleTimer;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        logout();
      }, 3600000); // 1 hour of inactivity
    };

    // Listen for user activity
    document.addEventListener("mousemove", resetIdleTimer);
    document.addEventListener("keypress", resetIdleTimer);
    document.addEventListener("scroll", resetIdleTimer);
    document.addEventListener("click", resetIdleTimer);
    document.addEventListener("touchstart", resetIdleTimer);

    resetIdleTimer(); // Start the timer

    return () => {
      clearTimeout(idleTimer);
      document.removeEventListener("mousemove", resetIdleTimer);
      document.removeEventListener("keypress", resetIdleTimer);
      document.removeEventListener("scroll", resetIdleTimer);
      document.removeEventListener("click", resetIdleTimer);
      document.removeEventListener("touchstart", resetIdleTimer);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, googleLogin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
