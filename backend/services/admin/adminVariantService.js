const Variant = require("../../models/Variant");
const cloudinary = require("../../config/cloudinary");

// ================= GENERATE VARIANTS =================

const generateVariants = (
  colors,
  sizes
) => {
  const variants = [];

  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        color,
        size,
      });
    }
  }

  return variants;
};

// ================= UPLOAD IMAGE =================
const uploadVariantImage = (
  file
) => {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "solestyle/variants",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(
              result.secure_url
            );
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
  );
};

// ================= CREATE VARIANTS =================

const createVariants = async (
  productId,
  variants,
  files = []
) => {
  if (!productId) {
    throw new Error(
      "Product ID is required"
    );
  }

  if (
    !Array.isArray(variants) ||
    variants.length === 0
  ) {
    throw new Error(
      "At least one variant is required"
    );
  }

  const uploadedImages = {};

  // ================= UPLOAD IMAGES =================

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const imageUrl =
      await uploadVariantImage(
        file
      );

    uploadedImages[i] =
      imageUrl;
  }

  // ================= CREATE VARIANTS =================

  const variantsToCreate =
    variants.map(
      (variant) => {
        const productImages =
          Array.isArray(
            variant.imageIndexes
          )
            ? variant.imageIndexes
                .map(
                  (index) =>
                    uploadedImages[
                      index
                    ]
                )
                .filter(Boolean)
            : [];

        return {
          productId,

          productImages,

          color:
            variant.color,

          size: Number(
            variant.size
          ),

          stock: Number(
            variant.stock
          ),

          price: Number(
            variant.price
          ),

          sku:
            variant.sku,

          isActive: true,
        };
      }
    );

  const createdVariants =
    await Variant.insertMany(
      variantsToCreate
    );

  return createdVariants;
};

// ================= GET PRODUCT VARIANTS =================

const getProductVariants = async (productId) => {
  const variants = await Variant.find({
    productId,
    isActive: true,
  })
    .sort({ color: 1, size: 1 })
    .lean();

  const updatedVariants = variants.map((variant) => {
    if (
      variant.mainImage &&
      Array.isArray(variant.productImages) &&
      variant.productImages.includes(variant.mainImage)
    ) {
      const otherImages = variant.productImages.filter(
        (image) => image !== variant.mainImage
      );

      return {
        ...variant,
        productImages: [
          variant.mainImage,
          ...otherImages,
        ],
      };
    }

    return variant;
  });

  return updatedVariants;
};

// ================= UPDATE VARIANT =================

const updateVariant = async (
  variantId,
  {
    color,
    size,
    stock,
    price,
    sku,
  }
) => {
  const variant =
    await Variant.findById(
      variantId
    );

  if (!variant) {
    throw new Error(
      "Variant not found"
    );
  }

  const updatedVariant =
    await Variant.findByIdAndUpdate(
      variantId,
      {
        ...(color !== undefined && {
          color: color.trim(),
        }),

        ...(size !== undefined && {
          size: Number(size),
        }),

        ...(stock !== undefined && {
          stock: Number(stock),
        }),

        ...(price !== undefined && {
          price: Number(price),
        }),

        ...(sku !== undefined && {
          sku: sku.trim(),
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

  return updatedVariant;
};

// ================= UPDATE MAIN IMAGE =================

const updateMainImage = async (
  productId,
  color,
  mainImage
) => {
  if (!productId) {
    throw new Error(
      "Product ID is required"
    );
  }

  if (!color) {
    throw new Error(
      "Color is required"
    );
  }

  if (!mainImage) {
    throw new Error(
      "Main image is required"
    );
  }

  const result =
    await Variant.updateMany(
      {
        productId,
        color,
        isActive: true,
      },
      {
        $set: {
          mainImage,
        },
      }
    );

  if (
    result.matchedCount === 0
  ) {
    throw new Error(
      "No variants found for this color"
    );
  }

  return await Variant.find({
    productId,
    color,
    isActive: true,
  }).lean();
};

// ================= UPDATE COLOR VARIANT IMAGES =================

const updateColorImages = async (
  productId,
  color,
  existingImages = [],
  files = []
) => {
  if (!productId || !color?.trim()) {
    throw new Error("Product ID and color are required");
  }

  if (!Array.isArray(existingImages)) {
    throw new Error("Invalid existing images");
  }

  const variants = await Variant.find({
    productId,
    color: color.trim(),
    isActive: true,
  });

  if (variants.length === 0) {
    throw new Error("No active variants found for this color");
  }

  const uploadedImages = [];

  for (const file of files) {
    const imageUrl = await uploadVariantImage(file);
    uploadedImages.push(imageUrl);
  }

  const productImages = [
    ...existingImages,
    ...uploadedImages,
  ];

  if (productImages.length < 3 || productImages.length > 5) {
    throw new Error("Each color must have 3 to 5 images");
  }

  if (
    productImages.some(
      (image) => typeof image !== "string" || !image.trim()
    )
  ) {
    throw new Error("Invalid image URL");
  }

  const currentMainImage = variants[0].mainImage || "";

  const mainImage = productImages.includes(currentMainImage)
    ? currentMainImage
    : productImages[0];

  await Variant.updateMany(
    {
      productId,
      color: color.trim(),
      isActive: true,
    },
    {
      $set: {
        productImages,
        mainImage,
      },
    }
  );

  return await Variant.find({
    productId,
    color: color.trim(),
    isActive: true,
  })
    .sort({ size: 1 })
    .lean();
};



// ================= EXPORT =================

module.exports = {
  generateVariants,
  createVariants,
  getProductVariants,
  updateVariant,
  updateMainImage,
  updateColorImages,
};