import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";
import ConfirmationModal from "../components/common/ConfirmationModal";
import {
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
  deleteAdminProduct,
  activateAdminProduct,
} from "../api/services/adminService";

import "./AdminProducts.css";

function AdminProducts() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);

  // ================= SEARCH =================

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ================= CATEGORY FILTER =================

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // ================= PAGINATION =================

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  });

  // ================= LOADING =================

  const [loading, setLoading] = useState(false);

  // ================= DELETE PRODUCT =================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ================= NOTIFICATIONS =================

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showNotification = (
    message,
    type = "success",
    title = type === "success" ? "Success" : "Error",
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  // ================= FETCH CATEGORIES =================

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategories();

      setCategories(data.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  // ================= FETCH PRODUCTS =================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 5,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const data = await getAdminProducts(params);

      setProducts(data.products || []);

      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
        },
      );
    } catch (error) {
      console.error("Fetch products error:", error);

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch products",
        "error",
        "Loading Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE PRODUCT =================

  const handleDeleteProduct = async () => {
    if (!deletingProduct) {
      return;
    }

    try {
      setDeleting(true);

      const data = await deleteAdminProduct(deletingProduct._id);

      if (!data.success) {
        throw new Error(data.message || "Failed to delete product");
      }

      setShowDeleteModal(false);
      setDeletingProduct(null);

      await fetchProducts();

      showNotification(
        "Product deleted successfully",
        "success",
        "Product Deleted",
      );
    } catch (error) {
      console.error("Delete product error:", error);

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete product",
        "error",
        "Delete Failed",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ================= ACTIVATE PRODUCT =================

  const handleActivateProduct = async (productId) => {
    try {
      const data = await activateAdminProduct(productId);

      if (!data.success) {
        throw new Error(data.message || "Failed to activate product");
      }

      await fetchProducts();

      showNotification(
        "Product activated successfully",
        "success",
        "Product Activated",
      );
    } catch (error) {
      console.error("Activate product error:", error);

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to activate product",
        "error",
        "Activation Failed",
      );
    }
  };

  // ================= LOAD DATA =================

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, selectedCategory]);

 // ================= PRODUCT NOTIFICATIONS =================

useEffect(() => {
  if (location.state?.productAdded) {
    showNotification(
      "Product added successfully",
      "success",
      "Product Added",
    );

    navigate("/admin/products", {
      replace: true,
      state: {},
    });

    return;
  }

  if (location.state?.productUpdated) {
    showNotification(
      "Product updated successfully",
      "success",
      "Product Updated",
    );

    navigate("/admin/products", {
      replace: true,
      state: {},
    });
  }
}, [location, navigate]);

  // ================= SEARCH =================

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  // ================= CLEAR =================

  const handleClear = () => {
    setSearch("");
    setSearchQuery("");
    setSelectedCategory("");
    setPage(1);
  };

  return (
    <AdminLayout title="Products">
      {/* ================= HEADER ================= */}

      <div className="products-header">
        <div>
          <h1>Product Management</h1>

          <p>Manage your store products.</p>
        </div>

        <button
          className="add-product-button"
          onClick={() => navigate("/admin/products/add")}
        >
          + Add Product
        </button>
      </div>

      {/* ================= SEARCH ================= */}

      <div className="product-search">
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);

            setPage(1);
          }}
        >
          <option value="">All Categories</option>

          {categories
            .filter((category) => category.isActive)
            .map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
        </select>

        <button onClick={handleSearch}>Search</button>

        <button className="clear-button" onClick={handleClear}>
          Clear
        </button>
      </div>

      {/* ================= DELETE CONFIRMATION ================= */}

      <ConfirmationModal
        isOpen={showDeleteModal && deletingProduct !== null}
        onCancel={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeletingProduct(null);
          }
        }}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={
          deletingProduct
            ? `Are you sure you want to delete "${deletingProduct.name}"?`
            : ""
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />

      {/* ================= PRODUCT TABLE ================= */}

      <div className="product-table-container">
        {loading ? (
          <div className="product-message">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="product-message">No products found.</div>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product, index) => (
                <tr key={product._id}>
                  <td>{(page - 1) * 5 + index + 1}</td>

                  <td>
                    {product.displayImage ? (
                      <button
                        type="button"
                        className="product-image-button"
                        onClick={() =>
                          navigate(`/admin/products/${product._id}`)
                        }
                      >
                        <img
                          src={product.displayImage}
                          alt={product.name}
                          className="product-table-image"
                        />
                      </button>
                    ) : (
                      <span>No image</span>
                    )}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="product-name-button"
                      onClick={() => navigate(`/admin/products/${product._id}`)}
                    >
                      {product.name}
                    </button>
                  </td>

                  <td>{product.categoryId?.name || "No category"}</td>

                  <td>₹{product.basePrice}</td>

                  <td>
                    <span
                      className={
                        product.isActive ? "status-active" : "status-inactive"
                      }
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>{new Date(product.createdAt).toLocaleDateString()}</td>

                  <td>
                    <button
                      className="edit-button"
                      onClick={() =>
                        navigate(`/admin/products/${product._id}/edit`)
                      }
                    >
                      Edit
                    </button>

                    {product.isActive ? (
                      <button
                        className="delete-button"
                        onClick={() => {
                          setDeletingProduct(product);

                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        className="activate-button"
                        onClick={() => handleActivateProduct(product._id)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= PAGINATION ================= */}

      {pagination.totalPages > 1 && (
        <div className="product-pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {pagination.totalPages}
          </span>

          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ================= NOTIFICATION ================= */}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </AdminLayout>
  );
}

export default AdminProducts;
