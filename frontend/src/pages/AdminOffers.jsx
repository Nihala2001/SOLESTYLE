
import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import api from "../api/axiosInstance";
import {
  getAdminOffers,
  addAdminOffer,
  updateAdminOffer,
  deactivateAdminOffer,
  activateAdminOffer,
} from "../api/services/adminOfferService";
import NotificationModal from "../components/common/NotificationModal";
import "./AdminOffers.css";

const emptyForm = {
  name: "",
  targetType: "Product",
  productId: "",
  categoryId: "",
  discountType: "Percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
};

const formatDateTime = (date) => {
  if (!date) return "";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  const localDate = new Date(
    value.getTime() - value.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
};

const getOfferStatus = (offer) => {
  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);

  if (!offer.isActive) return "Inactive";
  if (now < start) return "Scheduled";
  if (now > end) return "Expired";

  return "Active";
};

const formatDiscount = (offer) => {
  const discountType = offer.discountType || "Percentage";
  const discountValue =
    offer.discountValue ?? offer.discountPercentage ?? 0;

  if (discountType === "Fixed") {
    return `₹${Number(discountValue).toLocaleString("en-IN")}`;
  }

  return `${discountValue}%`;
};

function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOffers: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showNotification = (
    message,
    type = "success",
    title = type === "success" ? "Success" : "Error"
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeNotification = () => {
    setNotification((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);

      const data = await getAdminOffers(searchQuery, page, 5);

      setOffers(data.offers || []);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalOffers: 0,
        }
      );
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to fetch offers",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get("/admin/products", {
          params: { page: 1, limit: 100 },
        }),
        api.get("/admin/categories", {
          params: { page: 1, limit: 100 },
        }),
      ]);

      const productData = productResponse.data;
      const categoryData = categoryResponse.data;

      const productList = Array.isArray(productData)
        ? productData
        : productData.products || [];

      const categoryList = Array.isArray(categoryData)
        ? categoryData
        : categoryData.categories || [];

      setProducts(
        productList.filter((item) => item.isActive !== false)
      );

      setCategories(
        categoryList.filter((item) => item.isActive !== false)
      );
    } catch (error) {
      console.error("Offer form options error:", error);

      showNotification(
        error.response?.data?.message ||
          "Could not load products and categories. Please check your admin login.",
        "error"
      );
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [page, searchQuery]);

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchQuery("");
    setPage(1);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "targetType"
        ? {
            productId: "",
            categoryId: "",
          }
        : {}),
    }));

    setFormError("");
  };

  const openAddModal = () => {
    setEditingOffer(null);
    setForm({ ...emptyForm });
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);

    setForm({
      name: offer.name || "",
      targetType: offer.targetType || "Product",
      productId: offer.productId?._id || offer.productId || "",
      categoryId: offer.categoryId?._id || offer.categoryId || "",
      discountType: offer.discountType || "Percentage",
      discountValue: String(
        offer.discountValue ?? offer.discountPercentage ?? ""
      ),
      startDate: formatDateTime(offer.startDate),
      endDate: formatDateTime(offer.endDate),
    });

    setFormError("");
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingOffer(null);
    setForm({ ...emptyForm });
    setFormError("");
  };

  const handleSaveOffer = async (event) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const discount = Number(form.discountValue);
    const isPercentage = form.discountType === "Percentage";
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    if (!name) {
      setFormError("Please enter an offer name.");
      return;
    }

    if (!["Product", "Category"].includes(form.targetType)) {
      setFormError("Please select a valid offer type.");
      return;
    }

    if (form.targetType === "Product" && !form.productId) {
      setFormError("Please select a product.");
      return;
    }

    if (form.targetType === "Category" && !form.categoryId) {
      setFormError("Please select a category.");
      return;
    }

    if (!["Fixed", "Percentage"].includes(form.discountType)) {
      setFormError("Please select a valid discount type.");
      return;
    }

    if (
      form.discountValue === "" ||
      !Number.isFinite(discount) ||
      discount <= 0
    ) {
      setFormError(
        "Please enter a valid discount value greater than zero."
      );
      return;
    }

    if (isPercentage && discount > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      !form.startDate ||
      !form.endDate ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setFormError("Please select valid start and end dates.");
      return;
    }

    if (endDate <= startDate) {
      setFormError("The end date must be after the start date.");
      return;
    }

    const payload = {
      name,
      targetType: form.targetType,
      productId:
        form.targetType === "Product" ? form.productId : null,
      categoryId:
        form.targetType === "Category" ? form.categoryId : null,
      discountType: form.discountType,
      discountValue: discount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    try {
      setSaving(true);

      if (editingOffer) {
        await updateAdminOffer(editingOffer._id, payload);
        showNotification("Offer updated successfully.");
      } else {
        await addAdminOffer(payload);
        showNotification("Offer created successfully.");
      }

      setShowFormModal(false);
      setEditingOffer(null);
      setForm({ ...emptyForm });
      await fetchOffers();
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Failed to save offer."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateOffer = async () => {
    if (!selectedOffer) return;

    try {
      setProcessingAction(true);
      setActionError("");

      await deactivateAdminOffer(selectedOffer._id);

      setShowDeactivateModal(false);
      setSelectedOffer(null);

      showNotification("Offer deactivated successfully.");
      await fetchOffers();
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          "Failed to deactivate offer."
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleActivateOffer = async (offerId) => {
    try {
      await activateAdminOffer(offerId);

      showNotification("Offer activated successfully.");
      await fetchOffers();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to activate offer.",
        "error"
      );
    }
  };

  const getTargetName = (offer) => {
    if (offer.targetType === "Product") {
      if (offer.productId && typeof offer.productId === "object") {
        return offer.productId.name || "Product";
      }

      return (
        products.find(
          (product) => product._id === offer.productId
        )?.name || "Product"
      );
    }

    if (offer.categoryId && typeof offer.categoryId === "object") {
      return offer.categoryId.name || "Category";
    }

    return (
      categories.find(
        (category) => category._id === offer.categoryId
      )?.name || "Category"
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleString();
  };

  return (
    <AdminLayout title="Offers">
      <div className="offers-page">
        <div className="offers-header">
          <div>
            <h2>Offer Management</h2>
            <p>
              Create product and category discounts for your customers.
            </p>
          </div>

          <button
            className="offers-primary-btn"
            onClick={openAddModal}
          >
            + Add Offer
          </button>
        </div>

        <div className="offers-search">
          <input
            type="text"
            placeholder="Search offers, products or categories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />

          <button onClick={handleSearch}>Search</button>

          <button
            className="offers-secondary-btn"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        </div>

        <div className="offers-table-wrapper">
          <table className="offers-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Type</th>
                <th>Target</th>
                <th>Discount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="offers-message">
                    Loading offers...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="offers-message">
                    No offers found.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const status = getOfferStatus(offer);

                  return (
                    <tr key={offer._id}>
                      <td>{offer.name}</td>
                      <td>{offer.targetType}</td>
                      <td>{getTargetName(offer)}</td>
                      <td>{formatDiscount(offer)}</td>
                      <td>{formatDate(offer.startDate)}</td>
                      <td>{formatDate(offer.endDate)}</td>

                      <td>
                        <span
                          className={`offers-status offers-status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="offers-actions">
                          <button
                            className="offers-edit-btn"
                            onClick={() => openEditModal(offer)}
                          >
                            Edit
                          </button>

                          {offer.isActive ? (
                            <button
                              className="offers-deactivate-btn"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setActionError("");
                                setShowDeactivateModal(true);
                              }}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="offers-activate-btn"
                              onClick={() =>
                                handleActivateOffer(offer._id)
                              }
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="offers-pagination">
          <span>
            Page {pagination.currentPage || page} of{" "}
            {pagination.totalPages || 1}
          </span>

          <div>
            <button
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((previous) => Math.max(1, previous - 1))
              }
            >
              Previous
            </button>

            <button
              disabled={
                page >= (pagination.totalPages || 1) || loading
              }
              onClick={() =>
                setPage((previous) =>
                  Math.min(
                    pagination.totalPages || 1,
                    previous + 1
                  )
                )
              }
            >
              Next
            </button>
          </div>
        </div>

        {showFormModal && (
          <div className="offers-modal-overlay">
            <div className="offers-modal">
              <div className="offers-modal-header">
                <div>
                  <h3>
                    {editingOffer ? "Edit Offer" : "Create Offer"}
                  </h3>
                  <p>
                    Configure the discount and its validity period.
                  </p>
                </div>

                <button
                  type="button"
                  className="offers-close-btn"
                  onClick={closeFormModal}
                  disabled={saving}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveOffer}>
                <div className="offers-form-grid">
                  <label className="offers-full-width">
                    Offer Name
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateField}
                      placeholder="e.g. Festive footwear offer"
                      maxLength={100}
                      required
                    />
                  </label>

                  {/* Product Offer / Category Offer — preserved */}
                  <label>
                    Offer Type
                    <select
                      name="targetType"
                      value={form.targetType}
                      onChange={updateField}
                      required
                    >
                      <option value="Product">Product Offer</option>
                      <option value="Category">Category Offer</option>
                    </select>
                  </label>

                  {/* Discount Type */}
                  <label>
                    Discount Type
                    <select
                      name="discountType"
                      value={form.discountType}
                      onChange={updateField}
                      required
                    >
                      <option value="Percentage">
                        Percentage (%)
                      </option>
                      <option value="Fixed">
                        Fixed Amount (₹)
                      </option>
                    </select>
                  </label>

                  {/* Discount Value */}
                  <label>
                    {form.discountType === "Fixed"
                      ? "Discount Amount (₹)"
                      : "Discount Percentage (%)"}

                    <input
                      type="number"
                      name="discountValue"
                      value={form.discountValue}
                      onChange={updateField}
                      min="0.01"
                      max={
                        form.discountType === "Percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      placeholder={
                        form.discountType === "Fixed"
                          ? "e.g. 500"
                          : "e.g. 15"
                      }
                      required
                    />
                  </label>

                  {/* Product selection */}
                  {form.targetType === "Product" ? (
                    <label className="offers-full-width">
                      Product
                      <select
                        name="productId"
                        value={form.productId}
                        onChange={updateField}
                        required
                      >
                        <option value="">Select a product</option>

                        {products.map((product) => (
                          <option
                            key={product._id}
                            value={product._id}
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    /* Category selection */
                    <label className="offers-full-width">
                      Category
                      <select
                        name="categoryId"
                        value={form.categoryId}
                        onChange={updateField}
                        required
                      >
                        <option value="">Select a category</option>

                        {categories.map((category) => (
                          <option
                            key={category._id}
                            value={category._id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label>
                    Start Date and Time
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={form.startDate}
                      onChange={updateField}
                      required
                    />
                  </label>

                  <label>
                    End Date and Time
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={form.endDate}
                      onChange={updateField}
                      min={form.startDate || undefined}
                      required
                    />
                  </label>
                </div>

                {formError && (
                  <p className="offers-form-error">{formError}</p>
                )}

                <div className="offers-modal-actions">
                  <button
                    type="button"
                    className="offers-secondary-btn"
                    onClick={closeFormModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="offers-primary-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingOffer
                      ? "Save Changes"
                      : "Create Offer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeactivateModal && (
          <div className="offers-modal-overlay">
            <div className="offers-confirm-modal">
              <h3>Deactivate Offer?</h3>

              <p>
                Are you sure you want to deactivate{" "}
                <strong>{selectedOffer?.name}</strong>?
              </p>

              {actionError && (
                <p className="offers-form-error">{actionError}</p>
              )}

              <div className="offers-modal-actions">
                <button
                  className="offers-secondary-btn"
                  onClick={() => {
                    if (processingAction) return;

                    setShowDeactivateModal(false);
                    setSelectedOffer(null);
                  }}
                  disabled={processingAction}
                >
                  Cancel
                </button>

                <button
                  className="offers-deactivate-btn"
                  onClick={handleDeactivateOffer}
                  disabled={processingAction}
                >
                  {processingAction
                    ? "Deactivating..."
                    : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
        )}

        <NotificationModal
          isOpen={notification.isOpen}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      </div>
    </AdminLayout>
  );
}

export default AdminOffers;
