import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const clientId =
    "1019626177258-961n3ctfmegqk6iflp2ggsvm823emrtf.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ErrorBoundary>
        <Navbar />
        <main className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
