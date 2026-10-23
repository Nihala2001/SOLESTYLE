import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { getActiveCategories } from "../api/services/userCategoryService";

import { getCart } from "../api/services/userCartService";
import { getWishlist } from "../api/services/userWishlistService";

import { getActiveProducts } from "../api/services/userProductService";

import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const token = localStorage.getItem("userToken");

  // ================= GET ACTIVE CATEGORIES =================

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      if (!token) {
        if (active) {
          setCartCount(0);
          setWishlistCount(0);
        }
        return;
      }

      try {
        const [cartResult, wishlistResult] = await Promise.all([
          getCart(),
          getWishlist(),
        ]);

        if (!active) return;

        // Support either direct data or controller-wrapped responses

        const cartItems = cartResult?.cart?.items ?? [];

        const wishlistItems = wishlistResult?.wishlist?.items ?? [];

        // Cart badge = total quantity of all cart items
        const totalCartQuantity = cartItems.reduce(
          (total, item) => total + (Number(item.quantity) || 0),
          0,
        );

        // Wishlist badge = number of saved items
        setCartCount(totalCartQuantity);
        setWishlistCount(wishlistItems.length);
      } catch (error) {
        console.error("Failed to load navbar counts:", error);
      }
    };

    loadCounts();

    window.addEventListener("cartUpdated", loadCounts);
    window.addEventListener("wishlistUpdated", loadCounts);

    return () => {
      active = false;
      window.removeEventListener("cartUpdated", loadCounts);
      window.removeEventListener("wishlistUpdated", loadCounts);
    };
  }, [token]);

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

  const handleProfile = () => {
    if (token) {
      navigate("/profile");
    } else {
      navigate("/login");
    }

    setMobileMenu(false);
  };

  useEffect(() => {
    const query = searchQuery.trim();

    if (!showSearch || query.length < 1) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const data = await getActiveProducts({
          search: query,
          page: 1,
          limit: 5,
        });

        if (!cancelled) {
          setSearchSuggestions(data.products || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchSuggestions([]);
          setShowSuggestions(true);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, showSearch]);

  return (
    <nav className="navbar">
      {/* ================= LOGO ================= */}

      <Link to="/" className="navbar-logo">
        SOLESTYLE
      </Link>

      {/* ================= DESKTOP NAVIGATION ================= */}

      <div className="navbar-links">
        <Link to="/">Home</Link>

        <Link to="/products">Shop</Link>

        {/* ================= CATEGORIES ================= */}

        <div className="category-dropdown">
          <button
            type="button"
            className="category-dropdown-button"
            onClick={() => setCategoryDropdown(!categoryDropdown)}
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
                  onClick={() => setCategoryDropdown(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ================= ABOUT US ================= */}

        <Link to="/about">About Us</Link>
      </div>

      {/* ================= DESKTOP ACTIONS ================= */}

      <div className="navbar-actions">
        {/* Search */}

        <button
          type="button"
          className="navbar-icon"
          onClick={() => setShowSearch((prev) => !prev)}
          title="Search"
          aria-label="Search products"
        >
          <Search size={20} />
        </button>
        {/* Wishlist */}
        <button
          className="navbar-icon"
          onClick={() => navigate("/wishlist")}
          title="Wishlist"
        >
          <span className="nav-icon-wrapper">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="nav-count-badge">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </span>
        </button>

        {/* Cart */}
        <button
          className="navbar-icon"
          onClick={() => navigate("/cart")}
          title="Cart"
        >
          <span className="nav-icon-wrapper">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="nav-count-badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
        </button>

        {/* Profile */}

        <button className="navbar-icon" onClick={handleProfile} title="Profile">
          <User size={20} />
        </button>
      </div>

      {showSearch && (
        <div className="navbar-search-container">
          <form
            className="navbar-search-form"
            onSubmit={(e) => {
              e.preventDefault();

              const query = searchQuery.trim();

              if (query) {
                navigate(`/products?search=${encodeURIComponent(query)}`);
                setShowSearch(false);
                setShowSuggestions(false);
                setSearchQuery("");
              }
            }}
          >
            <input
              type="search"
              placeholder="Search footwear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowSuggestions(true);
                }
              }}
              autoFocus
            />

            <button type="submit" aria-label="Submit search">
              <Search size={18} />
            </button>
          </form>

          {showSuggestions && (
            <div className="navbar-search-suggestions">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((product) => (
                  <button
                    type="button"
                    className="navbar-search-suggestion"
                    key={product._id}
                    onClick={() => {
                      navigate(
                        `/products?search=${encodeURIComponent(product.name)}`,
                      );
                      setShowSearch(false);
                      setShowSuggestions(false);
                      setSearchQuery("");
                    }}
                  >
                    <span>{product.name}</span>
                    <Search size={15} />
                  </button>
                ))
              ) : (
                <p className="navbar-search-empty">
                  No matching products found
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {/* ================= MOBILE MENU BUTTON ================= */}

      <button
        className="mobile-menu-button"
        onClick={() => setMobileMenu(!mobileMenu)}
        aria-label="Toggle menu"
      >
        {mobileMenu ? <X size={25} /> : <Menu size={25} />}
      </button>

      {/* ================= MOBILE MENU ================= */}

      {mobileMenu && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMobileMenu(false)}>
            Home
          </Link>

          <Link to="/products" onClick={() => setMobileMenu(false)}>
            Shop
          </Link>

          {/* ================= MOBILE CATEGORIES ================= */}

          <div className="mobile-category-section">
            <button
              type="button"
              className="mobile-category-button"
              onClick={() => setCategoryDropdown(!categoryDropdown)}
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

          <Link to="/about" onClick={() => setMobileMenu(false)}>
            About Us
          </Link>

          {/* ================= PROFILE ================= */}

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
            <span className="nav-icon-wrapper">
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="nav-count-badge">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </span>
            Wishlist
          </button>

          {/* Cart */}
          <button
            onClick={() => {
              navigate("/cart");
              setMobileMenu(false);
            }}
          >
            <span className="nav-icon-wrapper">
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="nav-count-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            Cart
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
