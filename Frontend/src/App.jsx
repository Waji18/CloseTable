import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboard from "./pages/owner/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageRestaurant from "./pages/owner/ManageRestaurant";
import OwnerReservations from "./pages/owner/Reservations";
import AdminApprovals from "./pages/admin/Approvals";
import UserManagement from "./pages/admin/UserManagement";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Restaurant Owner Routes */}
            <Route element={<ProtectedRoute roles={["Restaurant Owner"]} />}>
              <Route path="/owner">
                <Route index element={<OwnerDashboard />} />
                <Route path="restaurant" element={<ManageRestaurant />} />
                <Route path="reservations" element={<OwnerReservations />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute roles={["Admin"]} />}>
              <Route path="/admin">
                <Route index element={<AdminDashboard />} />
                <Route path="approvals" element={<AdminApprovals />} />
                <Route path="users" element={<UserManagement />} />
              </Route>
            </Route>

            {/* 404 Handling */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
