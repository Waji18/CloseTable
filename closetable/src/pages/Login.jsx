// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLogin from "../components/GoogleLogin";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard"); // Redirect to dashboard on successful login
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      await googleLogin(response);
      navigate("/dashboard"); // Redirect to dashboard on successful Google login
    } catch (error) {
      setError("Google login failed. Please try again.");
    }
  };

  const handleGoogleFailure = (response) => {
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "500px", width: "90%" }}
      >
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Login</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
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
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
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
                minLength="8"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onFailure={handleGoogleFailure}
            />
          </form>

          <div className="mt-3 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary text-decoration-none">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
