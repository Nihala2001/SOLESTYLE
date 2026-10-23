import api from "../axiosInstance";

export const createOrder = async (
  addressId,
  paymentMethod,
  couponCode = null,
  buyNowVariantId = null,
) => {
  const response = await api.post("/orders", {
    addressId,
    paymentMethod,
    couponCode,
    buyNowVariantId,
  });

  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/orders/my-orders");
  return response.data;
};



export const requestReturnExchange = async (
  orderId,
  itemIndex,
  type,
  reason,
  replacementVariantId = null,
  quantity = 1,
) => {
  const response = await api.post("/orders/return-exchange", {
    orderId,
    itemIndex,
    type,
    reason,
    quantity: Number(quantity),
    replacementVariantId:
      type === "Exchange" ? replacementVariantId : null,
  });

  return response.data;
};


// Cancel order


export const cancelOrder = async (orderId, itemIndex) => {
  const response = await api.patch("/orders/cancel", {
    orderId,
    itemIndex,
  });

  return response.data;
};


// download invoice
export const downloadInvoice = async (orderId) => {
  const response = await api.get(
    `/orders/${orderId}/invoice`,
    {
      responseType: "blob",
    }
  );

  const invoiceBlob = new Blob([response.data], {
    type: "application/pdf",
  });

  const downloadUrl = window.URL.createObjectURL(invoiceBlob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `SOLESTYLE-Invoice-${orderId}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
};


// ================= RAZORPAY PAYMENT =================

export const createRazorpayOrder = async (orderId) => {
  const response = await api.post(
    `/orders/${orderId}/razorpay/create`
  );

  return response.data;
};

export const verifyRazorpayPayment = async (
  orderId,
  paymentDetails,
) => {
  const response = await api.post(
    `/orders/${orderId}/razorpay/verify`,
    paymentDetails,
  );

  return response.data;
};