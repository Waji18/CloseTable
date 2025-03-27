import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          CloseTable
        </Link>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    Dashboard
                  </Link>
                </li>
                {user.role === "Customer" && (
                  <li className="nav-item">
                    <Link className="btn btn-primary" to="/register-restaurant">
                      Register Restaurant
                    </Link>
                  </li>
                )}
                {user.role === "Restaurant Owner" && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/owner-dashboard">
                      Owner Dashboard
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          <div className="d-flex">
            {user ? (
              <button onClick={logout} className="btn btn-outline-danger">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary me-2">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
