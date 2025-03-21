// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Connection timeout");
    } else if (!error.response) {
      console.error("Network error - check server connection");
    }
    return Promise.reject(error);
  }
);
// Create root
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <React.Suspense fallback={<LoadingSpinner />}>
            <App />
          </React.Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
