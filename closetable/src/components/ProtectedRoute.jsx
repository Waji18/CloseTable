import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  return user ? <Outlet /> : null;
};

export default ProtectedRoute;
