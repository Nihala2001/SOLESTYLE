
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

// Attach the appropriate token to each request.
api.interceptors.request.use((config) => {
  const userToken = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminToken");

  if (config.url?.startsWith("/admin")) {
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  }

  return config;
});

// Handle blocked customer accounts.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAdminRequest = error.config?.url?.startsWith("/admin");
    const errorCode = error.response?.data?.code;

    if (errorCode === "ACCOUNT_BLOCKED" && !isAdminRequest) {
      // Clear customer session only.
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");

      // Return the customer to login and replace the current history entry.
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
