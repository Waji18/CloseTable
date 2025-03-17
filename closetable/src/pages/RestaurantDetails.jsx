import React from 'react';
import { useLocation } from 'react-router-dom';

const RestaurantDetails = () => {
  const location = useLocation();
  const restaurant = location.state?.restaurant; // Get restaurant data from navigation state

  if (!restaurant) {
    return <div>Restaurant not found.</div>;
  }

  return (
    <div className="restaurant-details-page">
      {/* Restaurant Image with Overlay */}
      <div className="restaurant-hero position-relative">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="restaurant-hero-image img-fluid w-100"
        />
        <div className="hero-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end p-4 p-lg-5">
          <div className="container">
            <h1 className="text-white display-1 fw-bold mb-3">{restaurant.name}</h1>
            <p className="text-white fs-4">
              {restaurant.cuisine} • {restaurant.location}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="container mt-5">
        <div className="row g-4">
          {/* Left Column */}
          <div className="col-lg-8">
            {/* About Section */}
            <div className="card border-0 shadow-lg bg-white">
              <div className="card-body p-4 p-lg-5">
                <h2 className="card-title mb-4 fw-bold text-dark">About {restaurant.name}</h2>
                <p className="text-dark fs-5">
                  <strong>Rating:</strong> {restaurant.rating} ({restaurant.reviews} reviews)
                </p>
                <p className="text-dark fs-5">
                  <strong>Price:</strong> {restaurant.price}
                </p>
                <p className="text-dark fs-5">
                  <strong>Booked:</strong> {restaurant.booked} times today
                </p>

                {/* Overview Section */}
                <div className="mt-5">
                  <h3 className="fw-bold mb-4 text-dark">Overview</h3>
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li className="mb-3 text-dark">
                          <i className="fas fa-check-circle text-primary me-2"></i>
                          Experiences
                        </li>
                        <li className="mb-3 text-dark">
                          <i className="fas fa-check-circle text-primary me-2"></i>
                          Offers
                        </li>
                        <li className="mb-3 text-dark">
                          <i className="fas fa-check-circle text-primary me-2"></i>
                          Popular dishes
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li className="mb-3 text-dark">
                          <i className="fas fa-check-circle text-primary me-2"></i>
                          Photos
                        </li>
                        <li className="mb-3 text-dark">
                          <i className="fas fa-check-circle text-primary me-2"></i>
                          Menu
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="mt-5">
                  <h3 className="fw-bold mb-4 text-dark">About this restaurant</h3>
                  <p className="text-dark fs-5">
                    <strong>Fancy</strong> • Good for special occasions • <strong>Great for brunch</strong>
                  </p>
                  <p className="text-dark fs-5">
                    Fogo de Chão is an internationally-renowned steakhouse from Brazil that allows guests to discover what’s next at every turn. Founded in Southern Brazil in 1979, Fogo elevates the centuries-old culinary art of churrasco - roasting high-quality...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-4">
            {/* Reservation Section */}
            <div className="card border-0 shadow-lg bg-white">
              <div className="card-body p-4 p-lg-5">
                <h3 className="card-title mb-4 fw-bold text-dark">Make a reservation</h3>
                <p className="text-dark fs-5">
                  <strong>2 people</strong> • Mar 17, 2025 • 7:00 PM
                </p>
                <div className="mt-4">
                  <h5 className="fw-bold mb-3 text-dark">Select a time</h5>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-primary btn-lg">6:30 PM</button>
                    <button className="btn btn-primary btn-lg">6:45 PM</button>
                    <button className="btn btn-primary btn-lg">7:00 PM</button>
                    <button className="btn btn-primary btn-lg">7:15 PM</button>
                    <button className="btn btn-primary btn-lg">7:30 PM</button>
                    <button className="btn btn-outline-primary btn-lg">Notify me</button>
                  </div>
                  <p className="mt-3 text-dark fs-6"><em>Booked 49 times today</em></p>
                </div>
              </div>
            </div>

            {/* Private Dining Section */}
            <div className="card border-0 shadow-lg bg-white mt-4">
              <div className="card-body p-4 p-lg-5">
                <h3 className="card-title mb-4 fw-bold text-dark">Private dining</h3>
                <p className="text-dark fs-5">
                  Book your next event with us. <a href="#private-dining" className="text-decoration-none text-primary">View details</a>
                </p>
              </div>
            </div>

            {/* Experiences Section */}
            <div className="card border-0 shadow-lg bg-white mt-4">
              <div className="card-body p-4 p-lg-5">
                <h3 className="card-title mb-4 fw-bold text-dark">Experiences</h3>
                <p className="text-dark fs-5">
                  <strong>Stag’s Leap Wine Cellars Dinner</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;