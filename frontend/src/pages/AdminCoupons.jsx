
import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";

import {
  getAdminCoupons,
  addAdminCoupon,
  updateAdminCoupon,
  deactivateAdminCoupon,
  activateAdminCoupon,
} from "../api/services/adminCouponService";

import NotificationModal from "../components/common/NotificationModal";
import "./AdminCoupons.css";

const emptyForm = {
  code: "",
  description: "",
  discountType: "Percentage",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
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

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCoupons: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [showDeactivateModal, setShowDeactivateModal] =
    useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
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

  // ================= FETCH COUPONS =================

  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const data = await getAdminCoupons(searchQuery, page, 5);

      setCoupons(data.coupons || []);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCoupons: 0,
        }
      );
    } catch (error) {
      console.error("Fetch coupons error:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to fetch coupons",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, searchQuery]);

  // ================= SEARCH =================

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleClear = () => {
    setSearch("");
    setSearchQuery("");
    setPage(1);
  };

  // ================= FORM HELPERS =================

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setForm({ ...emptyForm });
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "Percentage",
      discountValue: String(coupon.discountValue ?? ""),
      minOrderAmount: String(coupon.minOrderAmount ?? 0),
      maxDiscount:
        coupon.maxDiscount == null
          ? ""
          : String(coupon.maxDiscount),
      startDate: formatDateTime(coupon.startDate),
      endDate: formatDateTime(coupon.endDate),
      usageLimit:
        coupon.usageLimit == null
          ? ""
          : String(coupon.usageLimit),
    });

    setFormError("");
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingCoupon(null);
    setForm({ ...emptyForm });
    setFormError("");
  };

  // ================= ADD / UPDATE COUPON =================

  const handleSaveCoupon = async (event) => {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    const description = form.description.trim();
    const discountValue = Number(form.discountValue);
    const minOrderAmount = Number(form.minOrderAmount);

    if (!code || !description) {
      setFormError("Coupon code and description are required.");
      return;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      setFormError("Enter a discount greater than zero.");
      return;
    }

    if (
      form.discountType === "Percentage" &&
      discountValue > 100
    ) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      !Number.isFinite(minOrderAmount) ||
      minOrderAmount < 0
    ) {
      setFormError("Minimum order amount cannot be negative.");
      return;
    }

    const maxDiscount =
      form.maxDiscount.trim() === ""
        ? null
        : Number(form.maxDiscount);

    if (
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount < 0)
    ) {
      setFormError("Enter a valid maximum discount.");
      return;
    }

    if (
      form.discountType === "Fixed" &&
      maxDiscount !== null
    ) {
      setFormError(
        "Maximum discount is only applicable to percentage coupons."
      );
      return;
    }

    const usageLimit =
      form.usageLimit.trim() === ""
        ? null
        : Number(form.usageLimit);

    if (
      usageLimit !== null &&
      (!Number.isInteger(usageLimit) || usageLimit < 1)
    ) {
      setFormError("Usage limit must be a positive whole number.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFormError("Start date and end date are required.");
      return;
    }

    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate < startDate
    ) {
      setFormError("End date must be on or after the start date.");
      return;
    }

    const payload = {
      code,
      description,
      discountType: form.discountType,
      discountValue,
      minOrderAmount,
      maxDiscount:
        form.discountType === "Percentage" ? maxDiscount : null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      usageLimit,
    };

    try {
      setSaving(true);
      setFormError("");

      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon._id, payload);

        showNotification(
          "Coupon updated successfully.",
          "success",
          "Coupon Updated"
        );
      } else {
        await addAdminCoupon(payload);

        showNotification(
          "Coupon created successfully.",
          "success",
          "Coupon Added"
        );
      }

      setShowFormModal(false);
      setEditingCoupon(null);
      setForm({ ...emptyForm });

      setSearch("");
      setSearchQuery("");
      setPage(1);

      if (page === 1 && searchQuery === "") {
        await fetchCoupons();
      }
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "Failed to save coupon."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= DEACTIVATE COUPON =================

  const handleDeactivateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      setDeactivating(true);
      setActionError("");

      await deactivateAdminCoupon(selectedCoupon._id);

      setShowDeactivateModal(false);
      setSelectedCoupon(null);

      showNotification(
        "Coupon deactivated successfully.",
        "success",
        "Coupon Deactivated"
      );

      await fetchCoupons();
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          "Failed to deactivate coupon."
      );
    } finally {
      setDeactivating(false);
    }
  };

  // ================= ACTIVATE COUPON =================

  const handleActivateCoupon = async (couponId) => {
    try {
      await activateAdminCoupon(couponId);

      showNotification(
        "Coupon activated successfully.",
        "success",
        "Coupon Activated"
      );

      await fetchCoupons();
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          "Failed to activate coupon.",
        "error"
      );
    }
  };

  // ================= DISPLAY HELPERS =================

  const formatDiscount = (coupon) => {
    if (coupon.discountType === "Percentage") {
      const cap =
        coupon.maxDiscount != null
          ? ` (max ₹${coupon.maxDiscount})`
          : "";

      return `${coupon.discountValue}%${cap}`;
    }

    return `₹${coupon.discountValue}`;
  };

  const getCouponStatus = (coupon) => {
    const now = Date.now();

    if (!coupon.isActive) return "Inactive";
    if (now < new Date(coupon.startDate).getTime()) {
      return "Scheduled";
    }
    if (now > new Date(coupon.endDate).getTime()) {
      return "Expired";
    }
    if (
      coupon.usageLimit != null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return "Limit Reached";
    }

    return "Active";
  };

  return (
    <AdminLayout title="Coupons">
      <div className="coupons-header">
        <div>
          <h1>Coupon Management</h1>
          <p>Create and manage discount coupons for SOLESTYLE.</p>
        </div>

        <button
          className="coupons-primary-button"
          onClick={openAddModal}
        >
          + Add Coupon
        </button>
      </div>

      {/* SEARCH */}

      <div className="coupons-search">
        <input
          type="text"
          placeholder="Search coupon code or description..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
        />

        <button onClick={handleSearch}>Search</button>

        <button
          className="coupons-clear-button"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      {/* COUPON TABLE */}

      <div className="coupons-table-container">
        {loading ? (
          <div className="coupons-message">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="coupons-message">No coupons found.</div>
        ) : (
          <table className="coupons-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Description</th>
                <th>Discount</th>
                <th>Min. Order</th>
                <th>Validity</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {coupons.map((coupon, index) => {
                const status = getCouponStatus(coupon);

                return (
                  <tr key={coupon._id}>
                    <td>{(page - 1) * 5 + index + 1}</td>

                    <td className="coupons-code">
                      {coupon.code}
                    </td>

                    <td>{coupon.description}</td>

                    <td>{formatDiscount(coupon)}</td>

                    <td>₹{coupon.minOrderAmount ?? 0}</td>

                    <td className="coupons-validity">
                      <span>
                        From:{" "}
                        {new Date(
                          coupon.startDate
                        ).toLocaleDateString()}
                      </span>
                      <span>
                        To:{" "}
                        {new Date(
                          coupon.endDate
                        ).toLocaleDateString()}
                      </span>
                    </td>

                    <td>
                      {coupon.usedCount ?? 0} /{" "}
                      {coupon.usageLimit ?? "∞"}
                    </td>

                    <td>
                      <span
                        className={`coupons-status coupons-status-${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="coupons-actions">
                      <button
                        className="coupons-edit-button"
                        onClick={() => openEditModal(coupon)}
                      >
                        Edit
                      </button>

                      {coupon.isActive ? (
                        <button
                          className="coupons-deactivate-button"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setActionError("");
                            setShowDeactivateModal(true);
                          }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="coupons-activate-button"
                          onClick={() =>
                            handleActivateCoupon(coupon._id)
                          }
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}

      {pagination.totalPages > 1 && (
        <div className="coupons-pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((previous) => previous - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {pagination.totalPages}
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((previous) => previous + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showFormModal && (
        <div
          className="coupons-modal-overlay"
          onClick={closeFormModal}
        >
          <div
            className="coupons-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="coupons-modal-header">
              <div>
                <h2>
                  {editingCoupon ? "Edit Coupon" : "Add Coupon"}
                </h2>
                <p>
                  Configure the coupon discount and validity.
                </p>
              </div>

              <button
                type="button"
                className="coupons-close-button"
                onClick={closeFormModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveCoupon}>
              <div className="coupons-form-grid">
                <div className="coupons-form-field">
                  <label htmlFor="coupon-code">Coupon Code *</label>
                  <input
                    id="coupon-code"
                    name="code"
                    value={form.code}
                    onChange={updateField}
                    placeholder="e.g. SOLE10"
                    required
                    maxLength={30}
                  />
                </div>

                <div className="coupons-form-field">
                  <label htmlFor="coupon-description">
                    Description *
                  </label>
                  <input
                    id="coupon-description"
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="e.g. Festive special offer"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="coupons-form-field">
                  <label htmlFor="coupon-discount-type">
                    Discount Type *
                  </label>
                  <select
                    id="coupon-discount-type"
                    name="discountType"
                    value={form.discountType}
                    onChange={updateField}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="coupons-form-field">
                  <label htmlFor="coupon-discount-value">
                    Discount Value *
                  </label>
                  <input
                    id="coupon-discount-value"
                    name="discountValue"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      form.discountType === "Percentage"
                        ? 100
                        : undefined
                    }
                    value={form.discountValue}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="coupons-form-field">
                  <label htmlFor="coupon-minimum">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    id="coupon-minimum"
                    name="minOrderAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={updateField}
                    required
                  />
                </div>

                {form.discountType === "Percentage" && (
                  <div className="coupons-form-field">
                    <label htmlFor="coupon-max-discount">
                      Maximum Discount (₹), optional
                    </label>
                    <input
                      id="coupon-max-discount"
                      name="maxDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.maxDiscount}
                      onChange={updateField}
                      placeholder="No limit"
                    />
                  </div>
                )}

                <div className="coupons-form-field">
                  <label htmlFor="coupon-start-date">
                    Start Date & Time *
                  </label>
                  <input
                    id="coupon-start-date"
                    name="startDate"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="coupons-form-field">
                  <label htmlFor="coupon-end-date">
                    End Date & Time *
                  </label>
                  <input
                    id="coupon-end-date"
                    name="endDate"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={updateField}
                    min={form.startDate || undefined}
                    required
                  />
                </div>

                <div className="coupons-form-field">
                  <label htmlFor="coupon-usage-limit">
                    Total Usage Limit, optional
                  </label>
                  <input
                    id="coupon-usage-limit"
                    name="usageLimit"
                    type="number"
                    min="1"
                    step="1"
                    value={form.usageLimit}
                    onChange={updateField}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              {formError && (
                <p className="coupons-error">{formError}</p>
              )}

              <div className="coupons-modal-actions">
                <button
                  type="button"
                  className="coupons-cancel-button"
                  onClick={closeFormModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="coupons-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCoupon
                      ? "Update Coupon"
                      : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRMATION */}

      {showDeactivateModal && selectedCoupon && (
        <div
          className="coupons-modal-overlay"
          onClick={() => {
            if (!deactivating) {
              setShowDeactivateModal(false);
              setSelectedCoupon(null);
              setActionError("");
            }
          }}
        >
          <div
            className="coupons-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Deactivate Coupon</h2>

            <p>
              Are you sure you want to deactivate{" "}
              <strong>{selectedCoupon.code}</strong>?
              Customers will no longer be able to use this coupon.
            </p>

            {actionError && (
              <p className="coupons-error">{actionError}</p>
            )}

            <div className="coupons-modal-actions">
              <button
                type="button"
                className="coupons-cancel-button"
                disabled={deactivating}
                onClick={() => {
                  setShowDeactivateModal(false);
                  setSelectedCoupon(null);
                  setActionError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="coupons-deactivate-button"
                disabled={deactivating}
                onClick={handleDeactivateCoupon}
              >
                {deactivating ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AdminCoupons;