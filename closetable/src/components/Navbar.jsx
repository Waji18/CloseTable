// Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const Navbar = () => {
  const { user, loginWithRedirect, logout, isAuthenticated } = useAuth0();

  const handleLogin = () => {
    console.log("Initiating login from:", window.location.href);
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
      appState: {
        returnTo: window.location.pathname,
      },
    });
  };

  const handleLogout = () => {
    console.log("Initiating logout from:", window.location.origin);
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow-lg">
      <div className="container">
        <Link className="navbar-brand fs-3 fw-bold" to="/">
          Close Table
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link fs-5" to="/">
                Home
              </Link>
            </li>

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="nav-link fs-5 text-white">
                    Welcome, {user?.name || user?.email}
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    className="nav-link fs-5 btn btn-link text-white"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button
                  className="nav-link fs-5 btn btn-link text-white"
                  onClick={handleLogin}
                >
                  Login
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
