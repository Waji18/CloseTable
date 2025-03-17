import React from 'react';

const Login = () => {
  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4 p-lg-5" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="card-body text-center">
          <h2 className="card-title mb-4 fw-bold">Login</h2>
          <form>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-start w-100">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter your email"
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