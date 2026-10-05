
import React from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";

function CustomerLayout() {
  return (
    <div className="customer-layout">

      <Navbar />

      <main className="customer-main">
        <Outlet />
      </main>

      <Footer />

    </div>
  );
}

export default CustomerLayout;

