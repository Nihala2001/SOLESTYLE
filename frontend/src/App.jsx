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

import GuestRoute from "./components/GuestRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Wallet from "./pages/Wallet";
import AboutUs from "./pages/AboutUs";

import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProfile from "./pages/AdminProfile";
import AdminCategories from "./pages/AdminCategories";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminUserDetails from "./pages/AdminUserDetails";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminProductDetails from "./pages/AdminProductDetails";
import AdminEditVariant from "./pages/AdminEditVariant";
import AdminEditProduct from "./pages/AdminEditProduct";
import AdminReturns from "./pages/AdminReturns";
import AdminCoupons from "./pages/AdminCoupons";
import AdminOffers from "./pages/AdminOffers";
import AdminReviews from "./pages/AdminReviews";
import AdminSalesReport from "./pages/AdminSalesReport";

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

          <Route path="/wishlist" element={<Wishlist />} />

          <Route path="/checkout" element={<Checkout />} />

          <Route path="/orders/:orderId/track" element={<OrderTracking />} />

          <Route path="/wallet" element={<Wallet />} />

          <Route path="/about" element={<AboutUs />} />
        </Route>

        {/* ================= AUTHENTICATION ================= */}

        <Route element={<GuestRoute />}>
          <Route path="/register" element={<Register />} />

          <Route path="/login" element={<Login />} />

          <Route path="/verify-otp" element={<RegisterOtp />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/forgot-password-otp" element={<ForgotPasswordOtp />} />

          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ================= ADMIN ================= */}

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
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

          <Route path="/admin/returns" element={<AdminReturns />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/sales-report" element={<AdminSalesReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
