import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(
      (u) => u.email === formData.email && u.password === formData.password
    );
    if (user) {
      login(user); // Log the user in
      navigate('/'); // Redirect to home page
    } else {
      alert('Invalid email or password');
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4 p-lg-5" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="card-body text-center">
          <h2 className="card-title mb-4 fw-bold">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-start w-100">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label text-start w-100">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-flex justify-content-between mb-4">
              <a href="/forgot-email" className="text-decoration-none text-primary">
                Forgot Email?
              </a>
              <a href="/forgot-password" className="text-decoration-none text-primary">
                Forgot Password?
              </a>
            </div>
            <button type="submit" className="btn btn-primary w-100 btn-lg mb-3">
              Login
            </button>
            <div className="text-muted mb-3">or</div>
            <button
              type="button"
              className="btn btn-outline-primary w-100 btn-lg mb-3 d-flex align-items-center justify-content-center"
            >
              <i className="fab fa-google me-2"></i> Sign Up with Google
            </button>
          </form>
          <div className="mt-4">
            <p className="mb-0">
              Don't have an account?{' '}
              <a href="/signup" className="text-decoration-none text-primary">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;