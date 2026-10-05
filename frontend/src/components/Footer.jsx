
import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* ================= BRAND ================= */}

        <div className="footer-section footer-brand">

          <h2>SOLESTYLE</h2>

          <p>
            Step into your style with footwear
            designed for every woman.
          </p>

          <div className="footer-social">

            <a href="#" aria-label="Instagram">
              Instagram
            </a>

            <a href="#" aria-label="Facebook">
              Facebook
            </a>

            <a href="#" aria-label="Twitter">
              Twitter
            </a>

          </div>

        </div>


        {/* ================= QUICK LINKS ================= */}

        <div className="footer-section">

          <h3>Quick Links</h3>

          <Link to="/home">
            Home
          </Link>

          <Link to="/products">
            Shop
          </Link>

          <Link to="/wishlist">
            Wishlist
          </Link>

          <Link to="/cart">
            Cart
          </Link>

        </div>


        {/* ================= CATEGORIES ================= */}

        <div className="footer-section">

          <h3>Categories</h3>

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


        {/* ================= CONTACT ================= */}

        <div className="footer-section">

          <h3>Contact Us</h3>

          <p>
            <Mail size={16} />
            support@solestyle.com
          </p>

          <p>
            <Phone size={16} />
            +91 98765 43210
          </p>

          <p>
            <MapPin size={16} />
            Kerala, India
          </p>

        </div>

      </div>


      {/* ================= FOOTER BOTTOM ================= */}

      <div className="footer-bottom">

        <p>
          © {new Date().getFullYear()} SOLESTYLE.
          All rights reserved.
        </p>

        <div>

          <Link to="/privacy-policy">
            Privacy Policy
          </Link>

          <Link to="/terms">
            Terms & Conditions
          </Link>

        </div>

      </div>

    </footer>
  );
}

export default Footer;
