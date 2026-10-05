import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
} from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = useState(false);

  // Get the same token that is saved during login
  const token = localStorage.getItem("userToken");

  const handleProfile = () => {
    if (token) {
      navigate("/profile");
    } else {
      navigate("/login");
    }

    setMobileMenu(false);
  };

  return (
    <nav className="navbar">

      {/* ================= LOGO ================= */}

      <Link
        to="/home"
        className="navbar-logo"
      >
        SOLESTYLE
      </Link>


      {/* ================= DESKTOP NAVIGATION ================= */}

      <div className="navbar-links">

        <Link to="/home">
          Home
        </Link>

        <Link to="/products?category=sneakers">
          Sneakers
        </Link>

        <Link to="/products?category=heels">
          Heels
        </Link>

        <Link to="/products?category=flats">
          Flats
        </Link>

      </div>


      {/* ================= DESKTOP ACTIONS ================= */}

      <div className="navbar-actions">

        {/* Search */}

        <button
          className="navbar-icon"
          onClick={() => navigate("/products")}
          title="Search"
        >
          <Search size={20} />
        </button>


        {/* Wishlist */}

        <button
          className="navbar-icon"
          onClick={() => navigate("/wishlist")}
          title="Wishlist"
        >
          <Heart size={20} />
        </button>


        {/* Cart */}

        <button
          className="navbar-icon"
          onClick={() => navigate("/cart")}
          title="Cart"
        >
          <ShoppingBag size={20} />
        </button>


        {/* Profile */}

        <button
          className="navbar-icon"
          onClick={handleProfile}
          title="Profile"
        >
          <User size={20} />
        </button>

      </div>


      {/* ================= MOBILE MENU BUTTON ================= */}

      <button
        className="mobile-menu-button"
        onClick={() =>
          setMobileMenu(!mobileMenu)
        }
        aria-label="Toggle menu"
      >
        {mobileMenu ? (
          <X size={25} />
        ) : (
          <Menu size={25} />
        )}
      </button>


      {/* ================= MOBILE MENU ================= */}

      {mobileMenu && (

        <div className="mobile-menu">

          <Link
            to="/home"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            Home
          </Link>


          <Link
            to="/products?category=sneakers"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            Sneakers
          </Link>


          <Link
            to="/products?category=heels"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            Heels
          </Link>


          <Link
            to="/products?category=flats"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            Flats
          </Link>


          {/* Profile */}

          <button onClick={handleProfile}>
            <User size={18} />
            Profile
          </button>


          {/* Wishlist */}

          <button
            onClick={() => {
              navigate("/wishlist");
              setMobileMenu(false);
            }}
          >
            <Heart size={18} />
            Wishlist
          </button>


          {/* Cart */}

          <button
            onClick={() => {
              navigate("/cart");
              setMobileMenu(false);
            }}
          >
            <ShoppingBag size={18} />
            Cart
          </button>

        </div>

      )}

    </nav>
  );
}

export default Navbar;