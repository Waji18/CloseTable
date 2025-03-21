// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../index.css";

const NotFound = () => {
  const { user } = useAuth();

  return (
    <div className="notfound-page vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="error-card card shadow-lg p-5">
          <h1 className="display-1 text-danger fw-bold">404</h1>
          <h2 className="mb-4">Oops! Page Not Found</h2>
          <p className="lead text-muted mb-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="animate-bounce">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-4"></i>
          </div>
          <Link
            to={user ? "/dashboard" : "/"}
            className="btn btn-primary btn-lg"
          >
            <i className="fas fa-home me-2"></i>
            Go to {user ? "Dashboard" : "Homepage"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
