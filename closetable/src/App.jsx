import { useState, useEffect } from "react";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RestaurantDetails from "./pages/RestaurantDetails"; // Import RestaurantDetails
import axios from "axios";

const App = () => {
  const [count, Setcount] = useState(0);
  const FetchApi = async () => {
    const response = await axios.get("http://localhost:8080/api/users");
    console.log(response.data.users);
  };

  useEffect(() => {
    FetchApi();
  }, []);
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/restaurant-details"
          element={<RestaurantDetails />}
        />{" "}
        {/* Add route */}
      </Routes>
    </Router>
  );
};

export default App;
