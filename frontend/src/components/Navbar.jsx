
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
} from "lucide-react";
import { getActiveCategories } from "../api/services/userCategoryService";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);

  // ================= GET ACTIVE CATEGORIES =================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getActiveCategories();

        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

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
        to="/"
        className="navbar-logo"
      >
        SOLESTYLE
      </Link>


      {/* ================= DESKTOP NAVIGATION ================= */}

      <div className="navbar-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/products">
          Shop
        </Link>


        {/* ================= CATEGORIES ================= */}

        <div className="category-dropdown">

          <button
            type="button"
            className="category-dropdown-button"
            onClick={() =>
              setCategoryDropdown(!categoryDropdown)
            }
          >
            Categories
          </button>

          {categoryDropdown && (
            <div className="category-dropdown-menu">

              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="category-dropdown-item"
                  onClick={() =>
                    setCategoryDropdown(false)
                  }
                >
                  {category.name}
                </Link>
              ))}

            </div>
          )}

        </div>

        {/* ================= ABOUT US ================= */}

        <Link to="/about">
          About Us
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
            to="/"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            Home
          </Link>


          <Link
            to="/products"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            Shop
          </Link>


          {/* ================= MOBILE CATEGORIES ================= */}

          <div className="mobile-category-section">

            <button
              type="button"
              className="mobile-category-button"
              onClick={() =>
                setCategoryDropdown(!categoryDropdown)
              }
            >
              Categories
            </button>


            {categoryDropdown && (
              <div className="mobile-category-list">

                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/products?category=${category._id}`}
                    onClick={() => {
                      setCategoryDropdown(false);
                      setMobileMenu(false);
                    }}
                  >
                    {category.name}
                  </Link>
                ))}

              </div>
            )}

          </div>


          {/* ================= ABOUT US ================= */}

          <Link
            to="/about"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            About Us
          </Link>


          {/* ================= PROFILE ================= */}

          <button onClick={handleProfile}>
            <User size={18} />
            Profile
          </button>


          {/* ================= WISHLIST ================= */}

          <button
            onClick={() => {
              navigate("/wishlist");
              setMobileMenu(false);
            }}
          >
            <Heart size={18} />
            Wishlist
          </button>


          {/* ================= CART ================= */}

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
