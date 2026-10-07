import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import {
  getAdminCategories,
  addAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  activateAdminCategory,
} from "../api/services/adminCategoryService";
import "./AdminCategories.css";

function AdminCategories() {
  const [categories, setCategories] = useState([]);

  // Search
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCategories: 0,
  });

  // Loading
  const [loading, setLoading] = useState(false);

  // ================= ADD CATEGORY STATES =================

  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  // ================= EDIT CATEGORY STATES =================

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);

  // ================= DELETE CATEGORY STATES =================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);


  // ...................FETCH CATEGORIES..............

  const fetchCategories = async () => {
  try {
    setLoading(true);

    const data = await getAdminCategories(
      searchQuery,
      page,
      5
    );

    setCategories(data.categories || []);

    setPagination(
      data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCategories: 0,
      }
    );
  } catch (error) {
    console.error(
      "Fetch categories error:",
      error
    );
  } finally {
    setLoading(false);
  }
};


  //...............ADD CATEGORY.....................

  const handleAddCategory = async () => {
  const trimmedName = categoryName.trim();

  if (!trimmedName) {
    setError("Category name is required");
    return;
  }

  try {
    setAdding(true);
    setError("");

    const data = await addAdminCategory({
      name: trimmedName,
    });

    // Close modal
    setShowAddModal(false);

    // Clear form
    setCategoryName("");
    setError("");

    // Reset search and page
    setSearch("");
    setSearchQuery("");
    setPage(1);

  } catch (error) {
    setError(
      error.response?.data?.message ||
        "Failed to add category"
    );
  } finally {
    setAdding(false);
  }
};

  // ..................EDIT CATEGORY....................

  const handleEditCategory = async () => {
  const trimmedName = editCategoryName.trim();

  if (!trimmedName) {
    setEditError("Category name is required");
    return;
  }

  if (!editingCategory) {
    return;
  }

  try {
    setUpdating(true);
    setEditError("");

    await updateAdminCategory(
      editingCategory._id,
      {
        name: trimmedName,
      }
    );

    // Close modal
    setShowEditModal(false);

    // Clear edit data
    setEditingCategory(null);
    setEditCategoryName("");
    setEditError("");

    // Refresh list
    fetchCategories();

  } catch (error) {
    setEditError(
      error.response?.data?.message ||
        "Failed to update category"
    );
  } finally {
    setUpdating(false);
  }
};


  //.......................DELETE CATEGORY...................

  const handleDeleteCategory = async () => {
  if (!deletingCategory) {
    return;
  }

  try {
    setDeleting(true);
    setDeleteError("");

    await deleteAdminCategory(
      deletingCategory._id
    );

    // Close modal
    setShowDeleteModal(false);

    // Clear delete data
    setDeletingCategory(null);
    setDeleteError("");

    // Refresh list
    fetchCategories();

  } catch (error) {
    console.error(
      "Delete category error:",
      error
    );

    setDeleteError(
      error.response?.data?.message ||
        "Failed to delete category"
    );

  } finally {
    setDeleting(false);
  }
};
  //...handle category reactivate............//

  const handleActivateCategory = async (categoryId) => {
  try {
    await activateAdminCategory(categoryId);

    fetchCategories();
  } catch (error) {
    console.error(
      "Activate category error:",
      error
    );
  }
};


  // ================= LOAD CATEGORIES =================

  useEffect(() => {
    fetchCategories();
  }, [page, searchQuery]);


  // ================= SEARCH =================

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };


  // ================= CLEAR =================

  const handleClear = () => {
    setSearch("");
    setSearchQuery("");
    setPage(1);
  };


  return (
    < AdminLayout title="Categories">

      {/* ================= HEADER ================= */}

      <div className="categories-header">

        <div>
          <h1>
            Category Management
          </h1>

          <p>
            Manage your store categories.
          </p>
        </div>

        <button
          className="add-category-button"
          onClick={() => {
            setShowAddModal(true);
            setCategoryName("");
            setError("");
          }}
        >
          + Add Category
        </button>

      </div>


      {/* ================= SEARCH ================= */}

      <div className="category-search">

        <input
          type="text"
          placeholder="Search category..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />

        <button onClick={handleSearch}>
          Search
        </button>

        <button
          className="clear-button"
          onClick={handleClear}
        >
          Clear
        </button>

      </div>


      {/* ================= ADD CATEGORY MODAL ================= */}

      {showAddModal && (
        <div
          className="category-modal-overlay"
          onClick={() => {
            if (!adding) {
              setShowAddModal(false);
              setError("");
            }
          }}
        >

          <div
            className="category-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2>
              Add Category
            </h2>

            <p className="modal-description">
              Create a new category for your store.
            </p>

            <label>
              Category Name
            </label>

            <input
              type="text"
              placeholder="Enter category name"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setError("");
              }}
              autoFocus
            />

            {error && (
              <p className="category-error">
                {error}
              </p>
            )}

            <div className="modal-buttons">

              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryName("");
                  setError("");
                }}
                disabled={adding}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-add-button"
                onClick={handleAddCategory}
                disabled={adding}
              >
                {adding
                  ? "Adding..."
                  : "Add Category"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ================= EDIT CATEGORY MODAL ================= */}

      {showEditModal && editingCategory && (
        <div
          className="category-modal-overlay"
          onClick={() => {
            if (!updating) {
              setShowEditModal(false);
              setEditingCategory(null);
              setEditError("");
            }
          }}
        >

          <div
            className="category-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2>
              Edit Category
            </h2>

            <p className="modal-description">
              Update the category name.
            </p>

            <label>
              Category Name
            </label>

            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => {
                setEditCategoryName(
                  e.target.value
                );
                setEditError("");
              }}
              autoFocus
            />

            {editError && (
              <p className="category-error">
                {editError}
              </p>
            )}

            <div className="modal-buttons">

              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setEditCategoryName("");
                  setEditError("");
                }}
                disabled={updating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-add-button"
                onClick={handleEditCategory}
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : "Update"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ================= DELETE CATEGORY MODAL ================= */}

      {showDeleteModal && deletingCategory && (
        <div
          className="category-modal-overlay"
          onClick={() => {
            if (!deleting) {
              setShowDeleteModal(false);
              setDeletingCategory(null);
              setDeleteError("");
            }
          }}
        >

          <div
            className="category-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2>
              Delete Category
            </h2>

            <p className="modal-description">
              Are you sure you want to delete{" "}
              <strong>
                "{deletingCategory.name}"
              </strong>
              ?
            </p>

            {deleteError && (
              <p className="category-error">
                {deleteError}
              </p>
            )}

            <div className="modal-buttons">

              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCategory(null);
                  setDeleteError("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={handleDeleteCategory}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ================= CATEGORY TABLE ================= */}

      <div className="category-table-container">

        {loading ? (

          <div className="category-message">
            Loading categories...
          </div>

        ) : categories.length === 0 ? (

          <div className="category-message">
            No categories found.
          </div>

        ) : (

          <table className="category-table">

            <thead>

              <tr>
                <th>#</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {categories.map(
                (category, index) => (

                  <tr
                    key={category._id}
                  >

                    <td>
                      {(page - 1) * 5 +
                        index +
                        1}
                    </td>

                    <td>
                      {category.name}
                    </td>

                    <td>

                      <span
                        className={
                          category.isActive
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>

                    <td>
                      {new Date(
                        category.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>

                      {/* EDIT */}

                      <button
                        className="edit-button"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryName(
                            category.name
                          );
                          setEditError("");
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>


                      {/* DELETE */}

                      {category.isActive ? (
  <button
    className="delete-button"
    onClick={() => {
      setDeletingCategory(category);
      setDeleteError("");
      setShowDeleteModal(true);
    }}
  >
    Delete
  </button>
) : (
  <button
    className="activate-button"
    onClick={() => handleActivateCategory(category._id)}
  >
    Activate
  </button>
)}

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* ================= PAGINATION ================= */}

      {pagination.totalPages > 1 && (

        <div className="category-pagination">

          <button
            disabled={page === 1}
            onClick={() =>
              setPage(
                (prev) => prev - 1
              )
            }
          >
            Previous
          </button>

          <span>
            Page {page} of{" "}
            {pagination.totalPages}
          </span>

          <button
            disabled={
              page ===
              pagination.totalPages
            }
            onClick={() =>
              setPage(
                (prev) => prev + 1
              )
            }
          >
            Next
          </button>

        </div>

      )}

    </AdminLayout>
  );
}

export default AdminCategories;