const generateSku = (color, size) => {
  const colorCode = color
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");

  return `SS-${colorCode}-${size}`;
};

const generateVariants = (colors, sizes) => {
  const variants = [];

  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        color,
        size,
        stock: "",
        price: "",
        sku: generateSku(color, size),
      });
    }
  }

  return variants;
};

export default generateVariants;