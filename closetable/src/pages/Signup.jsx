// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLogin from "../components/GoogleLogin";
import axios from "axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  const validateForm = () => {
    setError("");

    if (!formData.username) {
      setError("Username is required");
      return false;
    }
    if (!formData.email) {
      setError("Email is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format");
      return false;
    }

    if (formData.password.length < 10) {
      setError("Password must be at least 10 characters");
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter");
      return false;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter");
      return false;
    }
    if (!/\d/.test(formData.password)) {
      setError("Password must contain at least one number");
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Password must contain at least one special character");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "/api/signup",
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
        {
          timeout: 10000, // 10-second timeout
        }
      );

      if (response.status === 201) {
        navigate("/login");
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (err) {
      let errorMessage = "Signup failed. Please try again.";

      if (err.code === "ECONNABORTED") {
        errorMessage =
          "Connection timed out. Please check your internet connection.";
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      await googleLogin(response);
      navigate("/dashboard"); // Redirect to dashboard on successful Google signup
    } catch (error) {
      setError("Google signup failed. Please try again.");
    }
  };

  const handleGoogleFailure = () => {
    setError("Google signup failed. Please try again.");
  };

  return (
    <div className="signup-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "500px", width: "90%" }}
      >
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Sign Up</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                minLength="3"
                maxLength="50"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength="10"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                required
              >
                <option value="Customer">Customer</option>
                <option value="Resturant owner">Resturant owner</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onFailure={handleGoogleFailure}
            />

            <div className="mt-3 text-center">
              Already have an account?{" "}
              <a href="/login" className="text-primary">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
