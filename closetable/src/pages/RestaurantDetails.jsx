import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';

const RestaurantDetails = () => {
  const location = useLocation();
  const restaurant = location.state?.restaurant;
  
  // Section refs
  const overviewRef = useRef(null);
  const dishesRef = useRef(null);
  const photosRef = useRef(null);
  const menuRef = useRef(null);
  const reviewsRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };



  const restaurantData = {
    name: "Odeum",
    rating: 4.6,
    reviews: 2553,
    price: "$31 to $50",
    cuisine: "Mediterranean, Greek",
    images: Array(5).fill('https://via.placeholder.com/800x500'), // Replace with actual images
    menu: {/*...*/},
    location: "17500 Depot Street, Suite 180, Morgan Hill, CA 95037"
  };



  if (!restaurant) return <div>Restaurant not found.</div>;

  return (
    <div className="restaurant-details-page">
      {/* Keep original hero section */}
      <div className="restaurant-hero position-relative">
        <img src={restaurant.image} alt={restaurant.name} className="restaurant-hero-image img-fluid w-100" />
        <div className="hero-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end p-4 p-lg-5">
          <div className="container">
            <h1 className="text-white display-1 fw-bold mb-3">{restaurant.name}</h1>
            <p className="text-white fs-4">
              {restaurant.cuisine} • {restaurant.location}
            </p>
          </div>
        </div>
      </div>

      
       
      <div className="restaurant-header container">
        <h1>{restaurantData.name}</h1>
        <div className="rating-info">

          <span className="rating-badge">{restaurantData.rating} ★</span>
          <span>({restaurantData.reviews} reviews)</span>
          <span className="price">{restaurantData.price}</span>
          <span>{restaurantData.cuisine}</span>
        </div>
      </div>


      <div className="container mt-5">
        <div className="row g-4">
          {/* Left Column - Updated Sections */}
          <div className="col-lg-8">
            <nav className="section-nav mb-4">
              {['Overview', 'Dishes', 'Photos', 'Menu', 'Reviews'].map((section) => (
                <button
                  key={section}
                  className="btn btn-link text-dark fs-5 me-3"
                  onClick={() => scrollToSection(eval(section.toLowerCase() + 'Ref'))}
                >
                  {section}
                </button>
              ))}
            </nav>

            <section ref={overviewRef} className="card border-0 shadow-lg bg-white mb-4">
              <div className="card-body p-4 p-lg-5">
                <h2 className="card-title mb-4 fw-bold text-dark">About this restaurant</h2>
                <p>At Odeum Restaurant, Chef Calisi combines Roman and Greek cuisine with Spanish influences, and includes his creative and fun flair to traditional dishes. The Chef spares no expense with the best octopus imported from Spain and the salmon imported from Scotland, fresh local organic vegetables, and grass-fed beef from Australia and the Midwest, yet provides his customers with a reasonably priced menu, fit for every budget. Chef Calisi has not only trained with the very best in his field at the finest restaurants in New York and Italy, but also has a Michelin star to tuck in his toque, which he received during his tenure as Executive Chef and Partner at Dio Deka in Los Gatos. At Odeum, Chef Calisi gives each customer a Michelin Star experience, from his personal welcoming at the door, to his phenomenal culinary masterpieces, and exquisite plating and presentation.</p>
                {/* Overview content */}
              </div>
            </section>

            <section ref={dishesRef} className="card border-0 shadow-lg bg-white mb-4">
              <div className="card-body p-4 p-lg-5">
                <h2 className="card-title mb-4 fw-bold text-dark">Popular Dishes</h2>
                {/* Dishes content */}
              </div>
            </section>

            <section ref={photosRef} className="card border-0 shadow-lg bg-white mb-4">
              <div className="card-body p-4 p-lg-5">
                <h2 className="card-title mb-4 fw-bold text-dark">Photos</h2>
                {/* Photos content */}
              </div>
            </section>

            <section ref={menuRef} className="card border-0 shadow-lg bg-white mb-4">
              <div className="card-body p-4 p-lg-5">
                <h2 className="card-title mb-4 fw-bold text-dark">Menu</h2>
                {/* Menu content */}
              </div>
            </section>

            <section ref={reviewsRef} className="card border-0 shadow-lg bg-white mb-4">
              <div className="card-body p-4 p-lg-5">
                <h2 className="card-title mb-4 fw-bold text-dark">Reviews</h2>
                {/* Reviews content */}
              </div>
            </section>
          </div>

          {/* Right Column - Updated Reservation */}
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '20px' }}>
              <div className="card border-0 shadow-lg bg-white">
                <div className="card-body p-4 p-lg-5">
                  <h3 className="card-title mb-4 fw-bold text-dark">Make a reservation</h3>
                  
                  <div className="mb-3">
                    <label className="form-label">Party Size</label>
                    <select className="form-select">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Time</label>
                    <select className="form-select">
                      <option>7:00 PM</option>
                      <option>7:15 PM</option>
                      <option>7:30 PM</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <h5 className="fw-bold mb-3 text-dark">Select a time</h5>
                    <div className="d-flex flex-wrap gap-2">
                      {['6:30 PM', '6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'].map(time => (
                        <button key={time} className="btn btn-outline-primary">
                          {time}
                        </button>
                      ))}
                      <button className="btn btn-outline-primary w-100">
                        Notify me
                      </button>
                    </div>
                    <p className="mt-3 text-dark fs-6"><em>Booked 11 times today</em></p>
                  </div>
                </div>
              </div>

              {/* Keep original map and additional info */}
              <div className="card border-0 shadow-lg bg-white mt-4">
                <div className="card-body p-4 p-lg-5">
                  <h3 className="card-title mb-4 fw-bold text-dark">Location</h3>
                  <iframe
                    title="location-map"
                    className="w-100"
                    height="300"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.location)}&output=embed`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;