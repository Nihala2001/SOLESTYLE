import React from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowUpRight } from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/home" className="footer-logo">
            SOLESTYLE<span>.</span>
          </Link>
          <p>
            Find your perfect pair.
            <br />
            Walk with confidence.
          </p>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="footer-social-link"
          >
            Follow our style
            <ArrowUpRight size={14} />
          </a>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <Link to="/home">Home</Link>
          <Link to="/products">Shop All</Link>
          <Link to="/about">About Us</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>

        <div className="footer-column">
          <h3>Your Account</h3>
          <Link to="/profile">My Profile</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/profile">My Orders</Link>
        </div>

        <div className="footer-column footer-contact">
          <h3>Need Help?</h3>
          <p>We're here to help you find your perfect fit.</p>
          <a href="mailto:support@solestyle.com">
            <Mail size={16} />
            support@solestyle.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SOLESTYLE. All rights reserved.</p>

        <div className="footer-legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
