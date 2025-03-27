// src/pages/Dashboard.jsx
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import "../index.css";

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar bg-dark text-white">
        <div className="sidebar-header p-4">
          <h2 className="mb-0">Dashboard</h2>
          <p className="text-muted mb-0 small">
            Welcome back, {user?.username}
          </p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-user me-2"></i>
            Profile
          </NavLink>

          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-cog me-2"></i>
            Settings
          </NavLink>

          <button onClick={logout} className="nav-link logout-btn">
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="container-fluid p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Profile Component
export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-profile">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">User Profile</h3>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-4 text-center">
              <div className="profile-avatar">
                <i className="fas fa-user-circle fa-5x text-secondary"></i>
              </div>
              <h4 className="mt-3">{user?.name}</h4>
              <p className="text-muted">{user?.role}</p>
            </div>

            <div className="col-md-8">
              <dl className="row">
                <dt className="col-sm-3">Email</dt>
                <dd className="col-sm-9">{user?.email}</dd>

                <dt className="col-sm-3">Account Created</dt>
                <dd className="col-sm-9">
                  {new Date(user?.created_at).toLocaleDateString()}
                </dd>

                <dt className="col-sm-3">Last Login</dt>
                <dd className="col-sm-9">{new Date().toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
