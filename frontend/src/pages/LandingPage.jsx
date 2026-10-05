import { Link, useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  // All shopping actions currently go to registration
  const handleShopNow = () => {
    navigate("/register");
  };

  return (
    <div className="landing-page">

      {/* ================= NAVBAR ================= */}

      <nav className="landing-navbar">

        <Link to="/" className="landing-logo">
          SOLESTYLE
        </Link>

        <div className="nav-links">
          <a href="#home">HOME</a>
          <a href="#categories">CATEGORIES</a>
          <a href="#about">ABOUT</a>
        </div>

        <div className="nav-actions">

          {/* SIGN UP BUTTON */}
          <Link to="/register" className="nav-signup-btn">
            SIGN UP
          </Link>

        </div>

      </nav>


      {/* ================= HERO SECTION ================= */}

      <section className="hero-section" id="home">

        <div className="hero-content">

          <p className="hero-small-title">
            STEP INTO YOUR STYLE
          </p>

          <h1>
            Walk With
            <br />
            <span>Confidence.</span>
          </h1>

          <p className="hero-description">
            Discover elegant footwear designed for every
            mood, every moment and every version of you.
          </p>

          <button
            className="hero-button"
            onClick={handleShopNow}
          >
            CREATE ACCOUNT
          </button>

        </div>


        <div className="hero-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200&auto=format&fit=crop"
            alt="SOLESTYLE women's footwear"
            className="hero-image"
          />

        </div>

      </section>


      {/* ================= CATEGORY SECTION ================= */}

      <section
        className="categories-section"
        id="categories"
      >

        <div className="section-heading">

          <p>EXPLORE OUR COLLECTION</p>

          <h2>
            Find Your Perfect Pair
          </h2>

        </div>


        <div className="category-grid">

          {/* Sneakers */}

          <div className="category-card">

            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900&auto=format&fit=crop"
              alt="Sneakers"
            />

            <div className="category-overlay">

              <h3>Sneakers</h3>

              <button onClick={handleShopNow}>
                EXPLORE
              </button>

            </div>

          </div>


          {/* Heels */}

          <div className="category-card">

            <img
              src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=900&auto=format&fit=crop"
              alt="Heels"
            />

            <div className="category-overlay">

              <h3>Heels</h3>

              <button onClick={handleShopNow}>
                EXPLORE
              </button>

            </div>

          </div>


          {/* Flats */}

          <div className="category-card">

            <img
              src="https://images.unsplash.com/photo-1603487742131-4160ec999306?q=80&w=900&auto=format&fit=crop"
              alt="Flats"
            />

            <div className="category-overlay">

              <h3>Flats</h3>

              <button onClick={handleShopNow}>
                EXPLORE
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* ================= ABOUT SECTION ================= */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-content">

          <p className="about-small-title">
            ABOUT SOLESTYLE
          </p>

          <h2>
            Designed For
            <br />
            <span>Every Step.</span>
          </h2>

          <p>
            SOLESTYLE brings together modern design,
            everyday comfort and feminine elegance.
            From effortless flats to statement heels
            and everyday sneakers, find a pair that
            feels uniquely yours.
          </p>

        </div>

      </section>


      {/* ================= CTA SECTION ================= */}

      <section className="cta-section">

        <h2>
          Your Style Starts
          <br />
          From The Ground Up.
        </h2>

        <p>
          Discover the SOLESTYLE collection.
        </p>

        <button
          className="cta-button"
          onClick={handleShopNow}
        >
          SIGN UP NOW
        </button>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="landing-footer">

        <div className="footer-logo">
          SOLESTYLE
        </div>

        <p>
          © 2026 SOLESTYLE. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

export default LandingPage;