
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  activateProduct,
} = require("../../services/admin/adminProductService");

const cloudinary = require("../../config/cloudinary");

const uploadImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "solestyle/products",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};
// ================= ADD PRODUCT =================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      basePrice,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product description is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (
      basePrice === undefined ||
      basePrice === null ||
      basePrice === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Base price is required",
      });
    }

    const files = req.files || [];

    const imageUrls = [];

    for (const file of files) {
      const imageUrl = await uploadImageToCloudinary(file);
      imageUrls.push(imageUrl);
    }

    const product = await addProduct({
      name,
      description,
      categoryId,
      basePrice,
      images: imageUrls,
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add product",
    });
  }
};


// ================= GET PRODUCTS =================

const fetchProducts = async (req, res) => {
  try {
    const {
      search = "",
      categoryId = "",
      page = 1,
      limit = 5,
    } = req.query;

    const result = await getProducts({
      search,
      categoryId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};


// ================= UPDATE PRODUCT =================

const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      name,
      description,
      categoryId,
      basePrice,
      images,
    } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name cannot be empty",
      });
    }

    if (description !== undefined && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product description cannot be empty",
      });
    }

    const product = await updateProduct(productId, {
      name,
      description,
      categoryId,
      basePrice,
      images,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};


// ================= SOFT DELETE =================

const removeProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await deleteProduct(productId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};


// ================= ACTIVATE PRODUCT =================

const restoreProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await activateProduct(productId);

    return res.status(200).json({
      success: true,
      message: "Product activated successfully",
      product,
    });
  } catch (error) {
    console.error("Activate product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to activate product",
    });
  }
};


module.exports = {
  createProduct,
  fetchProducts,
  editProduct,
  removeProduct,
  restoreProduct,
};