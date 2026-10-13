import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const isLoggedIn = Boolean(localStorage.getItem("userToken"));

  return (
    <div className="home-page">
      {/* ================= HERO ================= */}

      <section className="home-hero">
        <div className="hero-content">
          <p className="hero-small-title">NEW COLLECTION</p>

          <h1>
            Step Into
            <br />
            Your Style
          </h1>

          <p className="hero-description">
            Discover elegant footwear designed to make every step yours.
          </p>

          {isLoggedIn ? (
            <Link to="/products" className="hero-button">
              SHOP NOW
            </Link>
          ) : (
            <div className="hero-auth-buttons">

              <Link to="/login" className="hero-button">
                LOGIN
              </Link>

              <Link
                to="/register"
                className="hero-secondary-button"
              >
                SIGN UP
              </Link>

            </div>
          )}

          
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80"
            alt="Women's footwear"
          />
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}

      <section className="categories-section">
        <div className="section-heading">
          <p>EXPLORE</p>
          <h2>Shop By Category</h2>
        </div>

        <div className="category-grid">
          <Link to="/products?category=sneakers" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
              alt="Sneakers"
            />

            <div className="category-name">
              <h3>SNEAKERS</h3>
              <span>SHOP NOW →</span>
            </div>
          </Link>

          <Link to="/products?category=heels" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80"
              alt="Heels"
            />

            <div className="category-name">
              <h3>HEELS</h3>
              <span>SHOP NOW →</span>
            </div>
          </Link>

          <Link to="/products?category=flats" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=700&q=80"
              alt="Flats"
            />

            <div className="category-name">
              <h3>FLATS</h3>
              <span>SHOP NOW →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ================= FEATURED ================= */}

      <section className="featured-section">
        <div className="section-heading">
          <p>CURATED FOR YOU</p>
          <h2>Featured Collection</h2>
        </div>

        <div className="featured-message">
          <p>
            Discover our latest styles, designed to complement every occasion.
          </p>

          <Link to="/products">VIEW ALL PRODUCTS →</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
