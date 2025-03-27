import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ roles }) {
  const { user, loading, isAdmin, isOwner, isCustomer } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;

  // No user - redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Check role permissions
  if (roles) {
    const hasRole = roles.some((role) => {
      if (role === "Admin") return isAdmin;
      if (role === "Restaurant Owner") return isOwner;
      if (role === "Customer") return isCustomer;
      return false;
    });

    if (!hasRole) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
