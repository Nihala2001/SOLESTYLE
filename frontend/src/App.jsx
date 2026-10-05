
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import CustomerLayout from "./components/CustomerLayout";

import LandingPage from "./pages/LandingPage";

import Register from "./components/authentication/Register";
import RegisterOtp from "./components/authentication/RegisterOtp";
import Login from "./components/authentication/Login";
import ForgotPassword from "./components/authentication/ForgotPassword";
import ForgotPasswordOtp from "./components/authentication/ForgotPasswordOtp";
import ResetPassword from "./components/authentication/ResetPassword";

import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";

import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProfile from "./pages/AdminProfile";
import AdminCategories from "./pages/AdminCategories";
import AdminProducts from "./pages/AdminProducts";

function App() {
  return (
    <BrowserRouter>

      <ScrollToTop />

      <Routes>

        {/* ================= PUBLIC PAGES ================= */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-otp"
          element={<RegisterOtp />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/forgot-password-otp"
          element={<ForgotPasswordOtp />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ================= CUSTOMER PAGES ================= */}

        <Route element={<CustomerLayout />}>

          <Route
            path="/home"
            element={<Home />}
          />

          <Route
            path="/profile"
            element={<UserProfile />}
          />

          {/* Add your future customer pages here */}

          {/* 
          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/wishlist"
            element={<Wishlist />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />
          */}

        </Route>


        {/* ================= ADMIN PAGES ================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        <Route
          path="/admin/profile"
          element={<AdminProfile />}
        />

        <Route
          path="/admin/categories"
          element={<AdminCategories />}
        />

        <Route
  path="/admin/products"
  element={<AdminProducts />}
/>

      </Routes>

    </BrowserRouter>
  );
}

export default App;

