import React, { useState, useEffect } from 'react';
import { FaSearch, FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';

const SearchBar = ({ onSearch }) => {
  // Get current date and time
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const today = new Date();
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // State for form fields
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [people, setPeople] = useState(1);
  const [query, setQuery] = useState('');

  // Update time every minute (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
    }, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ date, time, people, query });
  };

  return (
    <div className="search-bar p-4 bg-light shadow-sm">
      <div className="container">
        <form onSubmit={handleSearch} className="row g-3 align-items-center">
          <div className="col-md-3">
            <label htmlFor="date" className="form-label">
              <FaCalendarAlt className="me-2" /> Date
            </label>
            <input
              type="date"
              className="form-control"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="col-md-2">
            <label htmlFor="time" className="form-label">
              <FaClock className="me-2" /> Time
            </label>
            <input
              type="time"
              className="form-control"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="col-md-2">
            <label htmlFor="people" className="form-label">
              <FaUser className="me-2" /> People
            </label>
            <input
              type="number"
              className="form-control"
              id="people"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              min="1"
              required
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="query" className="form-label">
              <FaSearch className="me-2" /> Search Restaurant or Location
            </label>
            <input
              type="text"
              className="form-control"
              id="query"
              placeholder="Enter restaurant or location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div className="col-md-1 d-flex align-items-end">
            <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center">
              <FaSearch className="me-2" /> Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchBar;