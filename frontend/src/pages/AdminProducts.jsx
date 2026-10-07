import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import AdminLayout from "../components/admin/AdminLayout";
import {
  getAdminCategories,
  getAdminProducts,
  addAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  activateAdminProduct,
} from "../api/services/adminService";
import "./AdminProducts.css";

function AdminProducts() {
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

  // ================= ADD PRODUCT =================

  const [showAddModal, setShowAddModal] = useState(false);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [cropQueue, setCropQueue] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);

  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // ================= EDIT PRODUCT =================

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [editProductName, setEditProductName] = useState("");
  const [editProductDescription, setEditProductDescription] = useState("");
  const [editProductCategory, setEditProductCategory] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("");

  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);

  // ================= DELETE PRODUCT =================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ========================crop image====================================

  const createCroppedImage = async (imageSrc, pixelCrop) => {
    const image = new Image();

    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxWidth = 1200;
    const maxHeight = 1200;

    let width = pixelCrop.width;
    let height = pixelCrop.height;

    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height);

      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      width,
      height,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(
            new File([blob], "product-image.jpg", {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        0.85,
      );
    });
  };

  //..........handle image change.............//
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length < 3) {
      setAddError("Please select at least 3 product images");
      return;
    }

    if (files.length > 5) {
      setAddError("You can select a maximum of 5 product images");
      return;
    }

    setAddError("");

    const firstImage = URL.createObjectURL(files[0]);

    setCropQueue(files);
    setCurrentCropIndex(0);
    setCropImage(firstImage);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropConfirm = async () => {
    try {
      const croppedFile = await createCroppedImage(
        cropImage,
        croppedAreaPixels,
      );

      setProductImages((prevImages) => [...prevImages, croppedFile]);

      URL.revokeObjectURL(cropImage);

      const nextIndex = currentCropIndex + 1;

      if (nextIndex < cropQueue.length) {
        const nextImage = URL.createObjectURL(cropQueue[nextIndex]);

        setCurrentCropIndex(nextIndex);
        setCropImage(nextImage);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
      } else {
        setCropImage(null);
        setCropQueue([]);
        setCurrentCropIndex(0);
        setCroppedAreaPixels(null);
      }
    } catch (error) {
      console.error("Image crop error:", error);
      setAddError("Failed to process image");
    }
  };

  // .................................FETCH CATEGORIES

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategories();

      setCategories(data.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  // ...............................FETCH PRODUCTS
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
    } finally {
      setLoading(false);
    }
  };

  //.............................. ADD PRODUCT..........

  const handleAddProduct = async () => {
    const trimmedName = productName.trim();
    const trimmedDescription = productDescription.trim();

    if (!trimmedName) {
      setAddError("Product name is required");
      return;
    }

    if (!trimmedDescription) {
      setAddError("Product description is required");
      return;
    }

    if (!productCategory) {
      setAddError("Category is required");
      return;
    }

    if (basePrice === "" || basePrice === null || Number(basePrice) < 0) {
      setAddError("Valid base price is required");
      return;
    }

    if (productImages.length < 3) {
      setAddError("Please select at least 3 product images");
      return;
    }

    if (productImages.length > 5) {
      setAddError("You can select a maximum of 5 product images");
      return;
    }

    try {
      setAdding(true);
      setAddError("");

      const formData = new FormData();

      formData.append("name", trimmedName);
      formData.append("description", trimmedDescription);
      formData.append("categoryId", productCategory);
      formData.append("basePrice", Number(basePrice));

      productImages.forEach((image) => {
        formData.append("images", image);
      });

      const data = await addAdminProduct(formData);

      if (!data.success) {
        throw new Error(data.message || "Failed to add product");
      }

      // Close modal
      setShowAddModal(false);

      // Clear form
      setProductName("");
      setProductDescription("");
      setProductCategory("");
      setBasePrice("");
      setProductImages([]);
      setAddError("");

      // Refresh products
      fetchProducts();
    } catch (error) {
      console.error("Add product error:", error);

      setAddError(
        error.response?.data?.message ||
          error.message ||
          "Failed to add product",
      );
    } finally {
      setAdding(false);
    }
  };

  // .......................EDIT PRODUCT

  const handleEditProduct = async () => {
    const trimmedName = editProductName.trim();
    const trimmedDescription = editProductDescription.trim();

    if (!trimmedName) {
      setEditError("Product name is required");
      return;
    }

    if (!trimmedDescription) {
      setEditError("Product description is required");
      return;
    }

    if (!editProductCategory) {
      setEditError("Category is required");
      return;
    }

    if (
      editBasePrice === "" ||
      editBasePrice === null ||
      Number(editBasePrice) < 0
    ) {
      setEditError("Valid base price is required");
      return;
    }

    if (!editingProduct) {
      return;
    }

    try {
      setUpdating(true);
      setEditError("");

      const data = await updateAdminProduct(editingProduct._id, {
        name: trimmedName,
        description: trimmedDescription,
        categoryId: editProductCategory,
        basePrice: Number(editBasePrice),
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to update product");
      }

      // Close modal
      setShowEditModal(false);

      // Clear edit data
      setEditingProduct(null);
      setEditProductName("");
      setEditProductDescription("");
      setEditProductCategory("");
      setEditBasePrice("");
      setEditError("");

      // Refresh products
      fetchProducts();
    } catch (error) {
      console.error("Update product error:", error);

      setEditError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update product",
      );
    } finally {
      setUpdating(false);
    }
  };

  //....................DELETE PRODUCT.................
  const handleDeleteProduct = async () => {
    if (!deletingProduct) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const data = await deleteAdminProduct(deletingProduct._id);

      if (!data.success) {
        throw new Error(data.message || "Failed to delete product");
      }

      // Close modal
      setShowDeleteModal(false);

      // Clear data
      setDeletingProduct(null);
      setDeleteError("");

      // Refresh products
      fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);

      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete product",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ............................ACTIVATE PRODUCT..................

  const handleActivateProduct = async (productId) => {
    try {
      const data = await activateAdminProduct(productId);

      if (!data.success) {
        throw new Error(data.message || "Failed to activate product");
      }

      fetchProducts();
    } catch (error) {
      console.error("Activate product error:", error);
    }
  };

  //......................................LOAD DATA................
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, selectedCategory]);

  // SEARCH

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  //clear

  const handleClear = () => {
    setSearch("");
    setSearchQuery("");
    setSelectedCategory("");
    setPage(1);
  };

  // OPEN EDIT MODAL

  const openEditModal = (product) => {
    setEditingProduct(product);

    setEditProductName(product.name);
    setEditProductDescription(product.description);

    setEditProductCategory(product.categoryId?._id || product.categoryId || "");

    setEditBasePrice(product.basePrice);

    setEditError("");
    setShowEditModal(true);
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
          onClick={() => {
            setShowAddModal(true);
            setProductName("");
            setProductDescription("");
            setProductCategory("");
            setBasePrice("");
            setProductImages([]);
            setAddError("");
          }}
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

      {/* ================= ADD PRODUCT MODAL ================= */}

      {showAddModal && (
        <div
          className="product-modal-overlay"
          onClick={() => {
            if (!adding) {
              setShowAddModal(false);
              setAddError("");
            }
          }}
        >
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Product</h2>

            <p className="modal-description">
              Add a new product to your store.
            </p>

            <label>Product Name</label>

            <input
              type="text"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setAddError("");
              }}
              autoFocus
            />

            <label>Description</label>

            <textarea
              placeholder="Enter product description"
              value={productDescription}
              onChange={(e) => {
                setProductDescription(e.target.value);
                setAddError("");
              }}
            />

            <label>Category</label>

            <select
              value={productCategory}
              onChange={(e) => {
                setProductCategory(e.target.value);
                setAddError("");
              }}
            >
              <option value="">Select category</option>

              {categories
                .filter((category) => category.isActive)
                .map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
            </select>

            <label>Base Price</label>

            <input
              type="number"
              min="0"
              placeholder="Enter base price"
              value={basePrice}
              onChange={(e) => {
                setBasePrice(e.target.value);
                setAddError("");
              }}
            />

            {/* ================= PRODUCT IMAGES ================= */}

            <label>Product Images</label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />

            <p className="image-help">Select 3 to 5 product images.</p>

            {productImages.length > 0 && (
              <div className="image-preview-container">
                {productImages.map((image, index) => (
                  <div className="image-preview" key={index}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Product ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {addError && <p className="product-error">{addError}</p>}

            <div className="modal-buttons">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => {
                  setShowAddModal(false);
                  setProductName("");
                  setProductDescription("");
                  setProductCategory("");
                  setBasePrice("");
                  setProductImages([]);
                  setAddError("");
                }}
                disabled={adding}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-add-button"
                onClick={handleAddProduct}
                disabled={adding}
              >
                {adding ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT PRODUCT MODAL ================= */}

      {showEditModal && editingProduct && (
        <div
          className="product-modal-overlay"
          onClick={() => {
            if (!updating) {
              setShowEditModal(false);
              setEditingProduct(null);
              setEditError("");
            }
          }}
        >
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Product</h2>

            <p className="modal-description">Update the product details.</p>

            <label>Product Name</label>

            <input
              type="text"
              value={editProductName}
              onChange={(e) => {
                setEditProductName(e.target.value);
                setEditError("");
              }}
            />

            <label>Description</label>

            <textarea
              value={editProductDescription}
              onChange={(e) => {
                setEditProductDescription(e.target.value);

                setEditError("");
              }}
            />

            <label>Category</label>

            <select
              value={editProductCategory}
              onChange={(e) => {
                setEditProductCategory(e.target.value);

                setEditError("");
              }}
            >
              <option value="">Select category</option>

              {categories
                .filter((category) => category.isActive)
                .map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
            </select>

            <label>Base Price</label>

            <input
              type="number"
              min="0"
              value={editBasePrice}
              onChange={(e) => {
                setEditBasePrice(e.target.value);
                setEditError("");
              }}
            />

            {editError && <p className="product-error">{editError}</p>}

            <div className="modal-buttons">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  setEditProductName("");
                  setEditProductDescription("");
                  setEditProductCategory("");
                  setEditBasePrice("");
                  setEditError("");
                }}
                disabled={updating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-add-button"
                onClick={handleEditProduct}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE PRODUCT MODAL ================= */}

      {showDeleteModal && deletingProduct && (
        <div
          className="product-modal-overlay"
          onClick={() => {
            if (!deleting) {
              setShowDeleteModal(false);
              setDeletingProduct(null);
              setDeleteError("");
            }
          }}
        >
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Product</h2>

            <p className="modal-description">
              Are you sure you want to delete{" "}
              <strong>"{deletingProduct.name}"</strong>?
            </p>

            {deleteError && <p className="product-error">{deleteError}</p>}

            <div className="modal-buttons">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProduct(null);
                  setDeleteError("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={handleDeleteProduct}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="product-table-image"
                      />
                    ) : (
                      <span>No image</span>
                    )}
                  </td>

                  <td>{product.name}</td>

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
                      onClick={() => openEditModal(product)}
                    >
                      Edit
                    </button>

                    {product.isActive ? (
                      <button
                        className="delete-button"
                        onClick={() => {
                          setDeletingProduct(product);

                          setDeleteError("");

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

      {cropImage && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <h3>
              Crop Product Image {currentCropIndex + 1} of {cropQueue.length}
            </h3>

            <div className="crop-container">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="zoom-control">
              <label>Zoom</label>

              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>

            <div className="crop-modal-buttons">
              <button type="button" onClick={handleCropConfirm}>
                {currentCropIndex + 1 === cropQueue.length ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminProducts;
