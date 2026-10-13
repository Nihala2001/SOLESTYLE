import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

import { getActiveProducts } from "../api/services/userProductService";

import "./Products.css";

function Products() {
const [searchParams] = useSearchParams();
const navigate = useNavigate();

const categoryId = searchParams.get("category");

const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const PRODUCTS_PER_PAGE = 12;

const fetchProducts = async () => {
try {
setLoading(true);

  const data = await getActiveProducts({
    categoryId: categoryId || "",
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
  });

  if (data.success) {
    setProducts(data.products || []);

    // Supports pagination metadata returned in either format.
    const pages =
      data.totalPages ??
      data.pagination?.totalPages ??
      1;

    setTotalPages(Math.max(1, Number(pages) || 1));
  } else {
    setProducts([]);
    setTotalPages(1);
  }
} catch (error) {
  console.error("Failed to fetch products:", error);
  setProducts([]);
  setTotalPages(1);
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchProducts();
}, [categoryId, currentPage]);

// Reset to the first page when the category changes.
useEffect(() => {
setCurrentPage(1);
}, [categoryId]);

const handlePageChange = (page) => {
if (page < 1 || page > totalPages || page === currentPage) {
return;
}


setCurrentPage(page);
window.scrollTo({ top: 0, behavior: "smooth" });


};

if (loading) {
return ( <div className="products-loading">
Loading products... </div>
);
}

return ( <div className="products-page"> <div className="products-header"> <h1>Shop</h1>


    <p>
      Discover our collection of women’s footwear
    </p>
  </div>

  <div className="products-grid">
    {products.map((product) => (
      <div
        className="product-card"
        key={product._id}
        onClick={() =>
          navigate(`/products/${product._id}`)
        }
      >
        <div className="product-image-container">
          {product.displayImage ? (
            <img
              src={product.displayImage}
              alt={product.name}
              className="product-image"
            />
          ) : (
            <div className="product-no-image">
              No Image
            </div>
          )}

          <button
            type="button"
            className="product-wishlist-button"
            aria-label="Add to wishlist"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Heart size={19} />
          </button>
        </div>

        <div className="product-details">
          <p className="product-category">
            {product.categoryId?.name}
          </p>

          <h2 className="product-name">
            {product.name}
          </h2>

          <p className="product-price">
            ₹{product.basePrice}
          </p>
        </div>
      </div>
    ))}
  </div>

  {products.length === 0 && (
    <div className="no-products">
      No products available.
    </div>
  )}

  {/* Pagination */}
  {totalPages > 1 && products.length > 0 && (
    <div className="products-pagination">
      <button
        type="button"
        className="pagination-button"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      <div className="pagination-pages">
        {Array.from(
          { length: totalPages },
          (_, index) => index + 1
        ).map((page) => (
          <button
            type="button"
            key={page}
            className={`pagination-page ${
              currentPage === page ? "active" : ""
            }`}
            aria-current={
              currentPage === page ? "page" : undefined
            }
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="pagination-button"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  )}
</div>

);
}

export default Products;
