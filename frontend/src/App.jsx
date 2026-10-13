import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import CustomerLayout from "./components/CustomerLayout";

import Register from "./components/authentication/Register";
import RegisterOtp from "./components/authentication/RegisterOtp";
import Login from "./components/authentication/Login";
import ForgotPassword from "./components/authentication/ForgotPassword";
import ForgotPasswordOtp from "./components/authentication/ForgotPasswordOtp";
import ResetPassword from "./components/authentication/ResetPassword";


import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";


import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProfile from "./pages/AdminProfile";
import AdminCategories from "./pages/AdminCategories";
import AdminProducts from "./pages/AdminProducts";
import AdminUserDetails from "./pages/AdminUserDetails";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminProductDetails from "./pages/AdminProductDetails";
import AdminEditVariant from "./pages/AdminEditVariant";
import AdminEditProduct from "./pages/AdminEditProduct";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        {/* ================= CUSTOMER HOME ================= */}

        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/home" element={<Home />} />

          <Route path="/profile" element={<UserProfile />} />

          <Route path="/products" element={<Products />} />

          <Route path="/products/:productId" element={<ProductDetails />} />

          <Route path="/cart" element={<Cart />} />

          <Route path="/wishlist"  element={<Wishlist />} />

          <Route path="/checkout" element={<Checkout/>}  />
        </Route>

        {/* ================= AUTHENTICATION ================= */}

        <Route path="/register" element={<Register />} />

        <Route path="/verify-otp" element={<RegisterOtp />} />

        <Route path="/login" element={<Login />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/forgot-password-otp" element={<ForgotPasswordOtp />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= ADMIN ================= */}

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="/admin/users" element={<AdminUsers />} />

        <Route path="/admin/profile" element={<AdminProfile />} />

        <Route path="/admin/categories" element={<AdminCategories />} />

        <Route path="/admin/products" element={<AdminProducts />} />

        <Route path="/admin/users/:id" element={<AdminUserDetails />} />

        <Route path="/admin/products/add" element={<AdminAddProduct />} />

        <Route
          path="/admin/products/:productId"
          element={<AdminProductDetails />}
        />

        <Route
          path="/admin/products/:productId/variants/:variantId/edit"
          element={<AdminEditVariant />}
        />

        <Route
          path="/admin/products/:productId/edit"
          element={<AdminEditProduct />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
