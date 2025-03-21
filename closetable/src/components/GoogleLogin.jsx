// src/components/GoogleLogin.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import PropTypes from "prop-types";

const GoogleLoginButton = ({ onSuccess, onFailure }) => {
  const handleSuccess = async (response) => {
    try {
      const user = {
        email: response.credential, // Updated to use the `credential` field from the response
        name: response.name || "Google User", // Fallback for name
        picture: response.picture || "", // Fallback for picture
        googleId: response.sub, // Updated to use `sub` as the Google ID
      };
      onSuccess(user);
    } catch (error) {
      console.error("Google login error:", error);
      onFailure(error);
    }
  };

  const handleFailure = (error) => {
    console.error("Google login failed:", error);
    onFailure(error);
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleFailure} // Updated to use `onError` instead of `onFailure`
      useOneTap // Optional: Enables One Tap Login
      style={{
        width: "100%",
        backgroundColor: "#4285F4",
        color: "white",
        borderRadius: "4px",
        padding: "12px",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      Continue with Google
    </GoogleLogin>
  );
};

GoogleLoginButton.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onFailure: PropTypes.func.isRequired,
};

export default GoogleLoginButton;
