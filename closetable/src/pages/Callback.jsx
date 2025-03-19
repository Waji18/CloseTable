// src/pages/Callback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const Callback = () => {
  const { handleRedirectCallback } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      await handleRedirectCallback();
      navigate("/");
    };
    handleCallback();
  }, [handleRedirectCallback, navigate]);

  return <div>Loading...</div>;
};

export default Callback;
