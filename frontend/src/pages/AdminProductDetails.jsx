import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../components/admin/AdminLayout";

import { getAdminProducts } from "../api/services/adminService";

import { getProductVariants } from "../api/services/adminVariantService";

import "./AdminProductDetails.css";

function AdminProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FETCH PRODUCT + VARIANTS =================

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Get products
        const productResponse = await getAdminProducts({
          page: 1,
          limit: 100,
        });

        const products = productResponse.products || [];

        const selectedProduct = products.find((item) => item._id === productId);

        if (!selectedProduct) {
          setError("Product not found");
          return;
        }

        setProduct(selectedProduct);

        // Get variants
        const variantResponse = await getProductVariants(productId);

        setVariants(variantResponse.variants || []);
      } catch (error) {
        console.error("Failed to fetch product details:", error);

        setError(
          error.response?.data?.message || "Failed to load product details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // ================= GROUP VARIANTS BY COLOR =================

  const groupedVariants = variants.reduce((groups, variant) => {
    if (!groups[variant.color]) {
      groups[variant.color] = [];
    }

    groups[variant.color].push(variant);

    return groups;
  }, {});

  // ================= LOADING =================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-product-details">
          <p>Loading product...</p>
        </div>
      </AdminLayout>
    );
  }

  // ================= ERROR =================

  if (error) {
    return (
      <AdminLayout>
        <div className="admin-product-details">
          <button
            className="back-button"
            onClick={() => navigate("/admin/products")}
          >
            ← Back to Products
          </button>

          <p className="error-message">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  // ================= PAGE =================

  return (
    <AdminLayout>
      <div className="admin-product-details">
        {/* HEADER */}

        <div className="details-header">
          <button
            className="back-button"
            onClick={() => navigate("/admin/products")}
          >
            ← Back to Products
          </button>

          <h1>{product.name}</h1>
        </div>

        {/* PRODUCT INFORMATION */}

        <div className="product-info-card">
          <div className="product-image-section">
            {product.displayImage ? (
              <img
                src={product.displayImage}
                alt={product.name}
                className="product-details-image"
              />
            ) : (
              <div className="no-image">No image</div>
            )}
          </div>

          <div className="product-info">
            <h2>{product.name}</h2>

            <p>
              <strong>Category:</strong>{" "}
              {product.categoryId?.name || "No category"}
            </p>

            <p>
              <strong>Base Price:</strong> ₹{product.basePrice}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {product.isActive ? "Active" : "Inactive"}
            </p>

            <p className="product-description">
              <strong>Description:</strong> {product.description}
            </p>
          </div>
        </div>

        {/* VARIANTS */}

        <div className="variants-section">
          <div className="section-header">
            <h2>Product Variants</h2>

            <span>{variants.length} variants</span>
          </div>

          {Object.keys(groupedVariants).length === 0 ? (
            <div className="empty-variants">No variants available.</div>
          ) : (
            Object.entries(groupedVariants).map(([color, colorVariants]) => {
              const firstVariant = colorVariants[0];

              return (
                <div className="color-group" key={color}>
                  {/* COLOR HEADER */}

                  <div className="color-header">
                    <div>
                      <h3>{color}</h3>

                      <span>{colorVariants.length} sizes</span>
                    </div>
                  </div>

                  {/* COLOR IMAGES */}

                  <div className="variant-images">
                    {firstVariant?.productImages?.length > 0 ? (
                      firstVariant.productImages.map((image, index) => {
                        const isMainImage = image === firstVariant.mainImage;

                        return (
                          <div
                            className={
                              isMainImage
                                ? "variant-image-wrapper main-image-wrapper"
                                : "variant-image-wrapper"
                            }
                            key={index}
                          >
                            <img
                              src={image}
                              alt={`${color} ${index + 1}`}
                              className={
                                isMainImage
                                  ? "variant-image main-image"
                                  : "variant-image"
                              }
                            />

                            {isMainImage && (
                              <span className="main-image-label">
                                Main Image
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span>No images</span>
                    )}
                  </div>

                  {/* VARIANT TABLE */}

                  <div className="variant-table-wrapper">
                    <table className="variant-table">
                      <thead>
                        <tr>
                          <th>Size</th>

                          <th>Stock</th>

                          <th>Price</th>

                          <th>SKU</th>

                          <th>Status</th>

                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {colorVariants.map((variant) => (
                          <tr key={variant._id}>
                            <td>{variant.size}</td>

                            <td>{variant.stock}</td>

                            <td>₹{variant.price}</td>

                            <td>{variant.sku}</td>

                            <td>{variant.isActive ? "Active" : "Inactive"}</td>

                            <td>
                              <button
                                className="edit-variant-button"
                                onClick={() =>
                                  navigate(
                                    `/admin/products/${productId}/variants/${variant._id}/edit`,
                                  )
                                }
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminProductDetails;
