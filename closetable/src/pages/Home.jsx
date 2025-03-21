import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import SearchBar from "../components/SearchBar";
import restaurants from "../data";

const Home = () => {
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSearch = ({ date, time, people, query }) => {
    const filtered = restaurants.filter((restaurant) => {
      const matchesQuery =
        restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.location.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
    setFilteredRestaurants(filtered);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleReserveClick = (restaurant) => {
    navigate("/restaurant-details", { state: { restaurant } }); // Navigate to details page
  };

  return (
    <div className="home-page">
      <SearchBar onSearch={handleSearch} />
      <div className="container mt-4 position-relative">
        <h1 className="mb-4">Featured Restaurants</h1>
        <div className="restaurant-container" ref={scrollContainerRef}>
          {filteredRestaurants.map((restaurant, index) => (
            <div className="restaurant-card" key={index}>
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="restaurant-image"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x200?text=Image+Not+Found";
                }}
              />
              <div className="card-body">
                <h5 className="card-title">{restaurant.name}</h5>
                <p className="card-text">
                  {restaurant.cuisine} • {restaurant.price} -{" "}
                  {restaurant.location}
                </p>
                <p>
                  {restaurant.rating} ({restaurant.reviews} reviews)
                </p>
                <p>Booked {restaurant.booked} times today</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleReserveClick(restaurant)} // Pass restaurant data
                >
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="scroll-button left" onClick={scrollLeft}>
          &lt;
        </button>
        <button className="scroll-button right" onClick={scrollRight}>
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Home;
