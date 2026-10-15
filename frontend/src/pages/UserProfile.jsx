import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  User,
  Package,
  Heart,
  MapPin,
  Lock,
  LogOut,
  Camera,
  Plus,
  Pencil,
  Trash2,
  Check,
  Mail,
  X,
  Wallet,
} from "lucide-react";

import NotificationModal from "../components/common/NotificationModal";
import ConfirmationModal from "../components/common/ConfirmationModal";

import {
  getProfile,
  updateProfile,
  updateProfileImage,
  removeProfileImage,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  sendPasswordChangeOtp,
  verifyPasswordChangeOtp,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../api/services/userService";

import {
  getMyOrders,
  requestReturnExchange,
  cancelOrder,
} from "../api/services/userOrderService";

import "./UserProfile.css";

const isReturnExchangeAvailable = (order, type) => {
  if (!order?.deliveredAt || order.orderStatus !== "Delivered") {
    return false;
  }

  const allowedDays = type === "Return" ? 7 : 10;

  const deliveryDate = new Date(order.deliveredAt);
  deliveryDate.setHours(0, 0, 0, 0);

  const deadline = new Date(deliveryDate);
  deadline.setDate(deadline.getDate() + allowedDays);
  deadline.setHours(23, 59, 59, 999);

  return new Date() <= deadline;
};

function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= USER =================

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= ADDRESSES =================

  const [addresses, setAddresses] = useState([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // ================= ORDERS =================

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [showOrders, setShowOrders] = useState(false);

  // ================= RETURN / EXCHANGE =================

  const [returnExchangeForm, setReturnExchangeForm] = useState(null);
  const [returnExchangeReason, setReturnExchangeReason] = useState("");
  const [returnExchangeError, setReturnExchangeError] = useState("");
  const [returnExchangeLoading, setReturnExchangeLoading] = useState(false);

  const [selectedReplacementVariant, setSelectedReplacementVariant] =
    useState("");
  const [replacementVariantDetails, setReplacementVariantDetails] =
    useState(null);

  // ================= ADDRESS FORM =================

  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home",
    isDefault: false,
  });

  // ================= NOTIFICATION =================

  const [showNotification, setShowNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  // ================= CONFIRMATION =================

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationText, setConfirmationText] = useState("Confirm");

  // ================= EDIT PROFILE =================

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");

  // ================= PROFILE PHOTO =================

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // ================= CHANGE EMAIL =================

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // ================= CHANGE PASSWORD =================

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);

  // ================= FORM LOADING =================

  const [formLoading, setFormLoading] = useState(false);

  // ================= FETCH PROFILE =================

  useEffect(() => {
    fetchProfile();

    if (window.location.hash === "#addresses") {
      setShowAddresses(true);
      fetchAddresses();
    }
  }, []);

  // ================= RESTORE EXCHANGE SELECTION =================

  useEffect(() => {
    const exchangeReturn = location.state?.exchangeReturn;

    if (!exchangeReturn) {
      return;
    }

    setShowAddresses(false);
    setShowOrders(true);
    setOrdersError("");

    setReturnExchangeForm({
      orderId: exchangeReturn.orderId,
      itemIndex: exchangeReturn.itemIndex,
      type: "Exchange",
    });

    setReturnExchangeReason(exchangeReturn.reason || "");

    setSelectedReplacementVariant(
      exchangeReturn.replacementVariantId || "",
    );

    setReplacementVariantDetails({
      color: exchangeReturn.replacementColor || "",
      size: exchangeReturn.replacementSize ?? "",
      price: exchangeReturn.replacementPrice,
    });

    setReturnExchangeError("");

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);

        const response = await getMyOrders();

        if (response.success) {
          setOrders(response.orders || []);
        } else {
          setOrdersError(
            response.message || "Unable to load your orders.",
          );
        }
      } catch (error) {
        setOrdersError(
          error.response?.data?.message ||
            "Unable to load your orders.",
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();

    navigate("/profile", {
      replace: true,
      state: null,
    });
  }, [location.state, navigate]);

  // ================= NOTIFICATION FUNCTIONS =================

  const showNotificationMessage = (
    title,
    message,
    type = "success",
  ) => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
  };

  // ================= CONFIRMATION FUNCTIONS =================

  const showConfirmationMessage = (
    title,
    message,
    action,
    confirmText = "Confirm",
  ) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmationAction(() => action);
    setConfirmationText(confirmText);
    setShowConfirmation(true);
  };

  const handleConfirmationCancel = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  const handleConfirmationConfirm = () => {
    setShowConfirmation(false);

    if (confirmationAction) {
      confirmationAction();
    }

    setConfirmationAction(null);
  };

  // ================= GET USER PROFILE =================

  const fetchProfile = async () => {
    try {
      const data = await getProfile();

      if (data.success) {
        setUser(data.user);
      } else {
        console.error(data.message);

        showNotificationMessage(
          "Profile Error",
          data.message || "Unable to load profile.",
          "error",
        );
      }
    } catch (error) {
      console.error("Profile fetch error:", error);

      showNotificationMessage(
        "Profile Error",
        error.response?.data?.message ||
          "Something went wrong while loading your profile.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= EDIT PROFILE =================

  const openEditProfile = () => {
    setEditName(user.name || "");
    setShowEditProfile(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      showNotificationMessage(
        "Invalid Name",
        "Please enter your name.",
        "error",
      );
      return;
    }

    setFormLoading(true);

    try {
      const data = await updateProfile({
        name: editName.trim(),
      });

      if (data.success) {
        setUser(data.user);
        setShowEditProfile(false);

        showNotificationMessage(
          "Profile Updated",
          "Your profile has been updated successfully.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Update Failed",
          data.message || "Unable to update your profile.",
          "error",
        );
      }
    } catch (error) {
      console.error("Update profile error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to update your profile. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ================= CHANGE PROFILE PHOTO =================

  const openImageSelector = () => {
    const imageInput = document.getElementById("profile-image-input");

    if (imageInput) {
      imageInput.click();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showNotificationMessage(
        "Invalid Image",
        "Please select a valid image file.",
        "error",
      );

      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotificationMessage(
        "Image Too Large",
        "Please select an image smaller than 2 MB.",
        "error",
      );

      e.target.value = "";
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
      setShowImageModal(true);
    };

    reader.readAsDataURL(file);
  };

  // ================= SAVE PROFILE PHOTO =================

  const handleSaveProfileImage = async () => {
    if (!selectedImage || !imagePreview) {
      return;
    }

    setFormLoading(true);

    try {
      const data = await updateProfileImage({
        name: user.name,
        profileImage: [imagePreview],
      });

      if (data.success) {
        setUser(data.user);

        setSelectedImage(null);
        setImagePreview(null);
        setShowImageModal(false);

        const imageInput = document.getElementById("profile-image-input");

        if (imageInput) {
          imageInput.value = "";
        }

        showNotificationMessage(
          "Photo Updated",
          "Your profile photo has been updated successfully.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Upload Failed",
          data.message || "Unable to update your profile photo.",
          "error",
        );
      }
    } catch (error) {
      console.error("Profile image update error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to update your profile photo. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ================= CLOSE IMAGE MODAL =================

  const closeImageModal = () => {
    if (formLoading) {
      return;
    }

    setShowImageModal(false);
    setSelectedImage(null);
    setImagePreview(null);

    const imageInput = document.getElementById("profile-image-input");

    if (imageInput) {
      imageInput.value = "";
    }
  };

  // ================= REMOVE PROFILE PHOTO =================

  const handleRemoveProfileImage = () => {
    showConfirmationMessage(
      "Remove Profile Photo?",
      "Are you sure you want to remove your profile photo?",
      handleRemoveImage,
      "Remove",
    );
  };

  const handleRemoveImage = async () => {
    setFormLoading(true);

    try {
      const data = await removeProfileImage({
        name: user.name,
        profileImage: [],
      });

      if (data.success) {
        setUser(data.user);

        showNotificationMessage(
          "Photo Removed",
          "Your profile photo has been removed successfully.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Remove Failed",
          data.message || "Unable to remove your profile photo.",
          "error",
        );
      }
    } catch (error) {
      console.error("Remove profile image error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to remove your profile photo. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ================= CHANGE EMAIL =================

  const openChangeEmail = () => {
    setNewEmail("");
    setEmailOtp("");
    setEmailOtpSent(false);
    setShowChangeEmail(true);
  };

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();

    const email = newEmail.trim().toLowerCase();

    if (!email) {
      showNotificationMessage(
        "Email Required",
        "Please enter your new email address.",
        "error",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showNotificationMessage(
        "Invalid Email",
        "Please enter a valid email address.",
        "error",
      );
      return;
    }

    setFormLoading(true);

    try {
      const data = await sendEmailChangeOtp(email);

      if (data.success) {
        setNewEmail(email);
        setEmailOtpSent(true);

        showNotificationMessage(
          "OTP Sent",
          "OTP has been sent to your new email address.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Email Change Failed",
          data.message || "Unable to send OTP.",
          "error",
        );
      }
    } catch (error) {
      console.error("Send email OTP error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to send OTP. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();

    if (!emailOtp || !/^\d{6}$/.test(emailOtp)) {
      showNotificationMessage(
        "Invalid OTP",
        "Please enter a valid 6-digit OTP.",
        "error",
      );
      return;
    }

    setFormLoading(true);

    try {
      const data = await verifyEmailChangeOtp({
        newEmail: newEmail.trim().toLowerCase(),
        otp: emailOtp,
      });

      if (data.success) {
        setUser((previousUser) => ({
          ...previousUser,
          email: newEmail.trim().toLowerCase(),
        }));

        setShowChangeEmail(false);
        setNewEmail("");
        setEmailOtp("");
        setEmailOtpSent(false);

        showNotificationMessage(
          "Email Changed",
          "Your email address has been changed successfully.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Verification Failed",
          data.message || "Invalid OTP.",
          "error",
        );
      }
    } catch (error) {
      console.error("Verify email OTP error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to verify OTP. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const closeChangeEmail = () => {
    setShowChangeEmail(false);
    setNewEmail("");
    setEmailOtp("");
    setEmailOtpSent(false);
  };

  // ================= CHANGE PASSWORD =================

  const openChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordOtp("");
    setPasswordOtpSent(false);
    setShowChangePassword(true);
  };

  const handleSendPasswordOtp = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotificationMessage(
        "Missing Information",
        "Please fill in all password fields.",
        "error",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotificationMessage(
        "Password Mismatch",
        "New password and confirm password do not match.",
        "error",
      );
      return;
    }

    setFormLoading(true);

    try {
      const data = await sendPasswordChangeOtp({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (data.success) {
        setPasswordOtpSent(true);

        showNotificationMessage(
          "OTP Sent",
          "OTP has been sent to your registered email address.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Password Change Failed",
          data.message || "Unable to send OTP.",
          "error",
        );
      }
    } catch (error) {
      console.error("Send password OTP error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to send OTP. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyPasswordOtp = async (e) => {
    e.preventDefault();

    if (!passwordOtp || !/^\d{6}$/.test(passwordOtp)) {
      showNotificationMessage(
        "Invalid OTP",
        "Please enter a valid 6-digit OTP.",
        "error",
      );
      return;
    }

    setFormLoading(true);

    try {
      const data = await verifyPasswordChangeOtp({
        otp: passwordOtp,
        newPassword,
        confirmPassword,
      });

      if (data.success) {
        setShowChangePassword(false);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
        setPasswordOtpSent(false);

        showNotificationMessage(
          "Password Changed",
          "Your password has been changed successfully.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Verification Failed",
          data.message || "Invalid OTP.",
          "error",
        );
      }
    } catch (error) {
      console.error("Verify password OTP error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to verify OTP. Please try again.",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordOtp("");
    setPasswordOtpSent(false);
  };

  // ================= GET ADDRESSES =================

  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();

      if (data.success) {
        setAddresses(data.addresses);
      } else {
        console.error(data.message);

        showNotificationMessage(
          "Address Error",
          data.message || "Unable to load addresses.",
          "error",
        );
      }
    } catch (error) {
      console.error("Address fetch error:", error);

      showNotificationMessage(
        "Address Error",
        error.response?.data?.message ||
          "Something went wrong while loading addresses.",
        "error",
      );
    }
  };

  // ================= OPEN ADDRESSES =================

  const handleAddresses = () => {
    setShowOrders(false);
    setShowAddresses(true);
    fetchAddresses();
  };

  // ================= OPEN PROFILE =================

  const handleProfile = () => {
    setShowOrders(false);
    setShowAddresses(false);
  };

  // ================= OPEN ORDERS =================

  const handleOrders = async () => {
    setShowAddresses(false);
    setShowOrders(true);
    setOrdersError("");

    try {
      setOrdersLoading(true);

      const response = await getMyOrders();

      if (!response.success) {
        throw new Error(
          response.message || "Unable to load orders.",
        );
      }

      setOrders(response.orders || []);
    } catch (error) {
      setOrdersError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load your orders.",
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  // ================= ADDRESS INPUT =================

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAddressForm({
      ...addressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ================= RESET ADDRESS FORM =================

  const resetAddressForm = () => {
    setAddressForm({
      fullName: "",
      phone: "",
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
      addressType: "Home",
      isDefault: false,
    });
  };

  // ================= ADD ADDRESS =================

  const handleAddAddress = () => {
    setEditingAddressId(null);
    resetAddressForm();
    setShowAddressForm(true);
  };

  // ================= ADD / EDIT ADDRESS =================

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    try {
      let data;

      if (editingAddressId) {
        data = await updateAddress(editingAddressId, addressForm);
      } else {
        data = await addAddress(addressForm);
      }

      if (data.success) {
        const wasEditing = Boolean(editingAddressId);

        setShowAddressForm(false);
        setEditingAddressId(null);
        resetAddressForm();

        fetchAddresses();

        showNotificationMessage(
          wasEditing ? "Address Updated" : "Address Added",
          data.message ||
            (wasEditing
              ? "Your address has been updated successfully."
              : "Your address has been added successfully."),
          "success",
        );
      } else {
        showNotificationMessage(
          "Address Error",
          data.message || "Unable to save address.",
          "error",
        );
      }
    } catch (error) {
      console.error("Address submit error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to save the address. Please try again.",
        "error",
      );
    }
  };

  // ================= EDIT ADDRESS =================

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id);

    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });

    setShowAddressForm(true);
  };

  // ================= DELETE ADDRESS =================

  const handleDeleteAddressApi = async (addressId) => {
    try {
      const data = await deleteAddress(addressId);

      if (data.success) {
        fetchAddresses();

        showNotificationMessage(
          "Address Deleted",
          data.message || "The address has been deleted successfully.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Delete Failed",
          data.message || "Unable to delete the address.",
          "error",
        );
      }
    } catch (error) {
      console.error("Delete address error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to delete the address. Please try again.",
        "error",
      );
    }
  };

  // ================= DELETE CONFIRMATION =================

  const handleDeleteAddress = (addressId) => {
    showConfirmationMessage(
      "Delete Address?",
      "Are you sure you want to delete this address?",
      () => handleDeleteAddressApi(addressId),
      "Delete",
    );
  };

  // ================= SET DEFAULT ADDRESS =================

  const handleSetDefault = async (addressId) => {
    try {
      const data = await setDefaultAddress(addressId);

      if (data.success) {
        fetchAddresses();

        showNotificationMessage(
          "Default Address Updated",
          data.message || "Your default address has been updated.",
          "success",
        );
      } else {
        showNotificationMessage(
          "Update Failed",
          data.message || "Unable to set default address.",
          "error",
        );
      }
    } catch (error) {
      console.error("Set default error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        error.response?.data?.message ||
          "Unable to update the default address.",
        "error",
      );
    }
  };

  // ================= LOGOUT =================

  const logoutUser = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleLogout = () => {
    showConfirmationMessage(
      "Logout?",
      "Are you sure you want to logout?",
      logoutUser,
      "Logout",
    );
  };

  // ================= RETURN AND EXCHANGE =================

  const handleReturnExchangeClick = (orderId, itemIndex, type) => {
    setReturnExchangeForm({
      orderId,
      itemIndex,
      type,
    });

    setReturnExchangeReason("");
    setReturnExchangeError("");
    setSelectedReplacementVariant("");
    setReplacementVariantDetails(null);
  };

  const handleReturnExchangeSubmit = async (event) => {
    event.preventDefault();

    if (!returnExchangeReason.trim()) {
      setReturnExchangeError("Please enter a reason.");
      return;
    }

    if (
      returnExchangeForm.type === "Exchange" &&
      !selectedReplacementVariant
    ) {
      setReturnExchangeError(
        "Please choose a replacement color and size first.",
      );
      return;
    }

    try {
      setReturnExchangeLoading(true);
      setReturnExchangeError("");

      const response = await requestReturnExchange(
        returnExchangeForm.orderId,
        returnExchangeForm.itemIndex,
        returnExchangeForm.type,
        returnExchangeReason.trim(),
        returnExchangeForm.type === "Exchange"
          ? selectedReplacementVariant
          : null,
      );

      if (!response.success) {
        throw new Error(
          response.message || "Unable to submit your request.",
        );
      }

      const updatedOrders = await getMyOrders();

      if (updatedOrders.success) {
        setOrders(updatedOrders.orders || []);
      }

      const submittedType = returnExchangeForm.type;

      setReturnExchangeForm(null);
      setReturnExchangeReason("");
      setSelectedReplacementVariant("");
      setReplacementVariantDetails(null);
      setReturnExchangeError("");

      showNotificationMessage(
        "Request Submitted",
        response.message ||
          `${submittedType} request submitted successfully.`,
        "success",
      );
    } catch (error) {
      setReturnExchangeError(
        error.response?.data?.message ||
          error.message ||
          "Unable to submit your request.",
      );
    } finally {
      setReturnExchangeLoading(false);
    }
  };

  // ================= CANCEL ORDER =================

  const handleCancelOrder = (orderId) => {
    showConfirmationMessage(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      async () => {
        try {
          const response = await cancelOrder(orderId);

          if (!response.success) {
            throw new Error(
              response.message || "Unable to cancel order.",
            );
          }

          const updatedOrders = await getMyOrders();

          if (updatedOrders.success) {
            setOrders(updatedOrders.orders || []);
          }

          showNotificationMessage(
            "Order Cancelled",
            "Your order has been cancelled successfully.",
          );
        } catch (error) {
          showNotificationMessage(
            "Cancellation Failed",
            error.response?.data?.message ||
              error.message ||
              "Unable to cancel order.",
            "error",
          );
        }
      },
      "Yes, Cancel Order",
    );
  };

  // ================= LOADING =================

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!user) {
    return <p>Unable to load profile</p>;
  }

  return (
    <div className="profile-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="profile-sidebar">
        <h2>My Account</h2>

        <button
          className={`sidebar-item ${
            !showAddresses && !showOrders ? "active" : ""
          }`}
          onClick={handleProfile}
        >
          <User size={18} />
          <span>Profile</span>
        </button>

        <button
          className={`sidebar-item ${showOrders ? "active" : ""}`}
          onClick={handleOrders}
        >
          <Package size={18} />
          <span>My Orders</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => navigate("/wishlist")}
        >
          <Heart size={18} />
          <span>Wishlist</span>
        </button>

        <button
          className={`sidebar-item ${
            showAddresses && !showOrders ? "active" : ""
          }`}
          onClick={handleAddresses}
        >
          <MapPin size={18} />
          <span>Addresses</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => navigate("/wallet")}
        >
          <Wallet size={18} />
          <span>My Wallet</span>
        </button>

        <button
          className="sidebar-item"
          onClick={openChangePassword}
        >
          <Lock size={18} />
          <span>Change Password</span>
        </button>

        <button
          className="sidebar-item"
          onClick={openChangeEmail}
        >
          <Mail size={18} />
          <span>Change Email</span>
        </button>

        <button
          className="sidebar-item logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="profile-content">
        {showOrders ? (
          <>
            <h1>My Orders</h1>

            <p className="profile-subtitle">
              View your orders and track their delivery status.
            </p>

            {ordersLoading ? (
              <p>Loading your orders...</p>
            ) : ordersError ? (
              <p>{ordersError}</p>
            ) : orders.length === 0 ? (
              <div className="profile-card">
                <Package size={40} />
                <h3>No orders yet</h3>
                <p>Your placed orders will appear here.</p>

                <button
                  className="edit-profile-btn"
                  onClick={() => navigate("/products")}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="my-orders-list">
                {orders.map((order) => (
                  <div
                    className="profile-card my-order-card"
                    key={order._id}
                  >
                    <div className="my-order-header">
                      <div>
                        <h3>Order #{order.orderNumber}</h3>
                        <p>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="my-order-status">
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="my-order-items">
                      {order.items.map((item, index) => (
                        <div
                          className="my-order-item-details"
                          key={`${order._id}-${index}`}
                        >
                          <strong>{item.productName}</strong>

                          <p>
                            Color: {item.color || "N/A"} | Size:{" "}
                            {item.size || "N/A"}
                          </p>

                          <p>Quantity: {item.quantity}</p>

                          {item.returnExchange?.status &&
                          item.returnExchange.status !== "Not Requested" ? (
                            <p className="return-exchange-status">
                              {item.returnExchange.type} Status:{" "}
                              {item.returnExchange.status}
                            </p>
                          ) : order.orderStatus === "Delivered" ? (
                            <div>
                              <div className="return-exchange-actions">
                                {isReturnExchangeAvailable(
                                  order,
                                  "Return",
                                ) && (
                                  <button
                                    type="button"
                                    className="edit-profile-btn"
                                    onClick={() =>
                                      handleReturnExchangeClick(
                                        order._id,
                                        index,
                                        "Return",
                                      )
                                    }
                                  >
                                    Return
                                  </button>
                                )}

                                {isReturnExchangeAvailable(
                                  order,
                                  "Exchange",
                                ) && (
                                  <button
                                    type="button"
                                    className="edit-profile-btn"
                                    onClick={() =>
                                      handleReturnExchangeClick(
                                        order._id,
                                        index,
                                        "Exchange",
                                      )
                                    }
                                  >
                                    Exchange
                                  </button>
                                )}
                              </div>

                              {order.deliveredAt &&
                                !isReturnExchangeAvailable(
                                  order,
                                  "Return",
                                ) &&
                                !isReturnExchangeAvailable(
                                  order,
                                  "Exchange",
                                ) && (
                                  <p className="return-exchange-status">
                                    Return and exchange period has expired.
                                  </p>
                                )}
                            </div>
                          ) : null}

                          {returnExchangeForm?.orderId === order._id &&
                            returnExchangeForm?.itemIndex === index && (
                                                            <form
                                className="return-exchange-form"
                                onSubmit={handleReturnExchangeSubmit}
                              >
                                <h4>
                                  {returnExchangeForm.type === "Return"
                                    ? "Return this product"
                                    : "Exchange this product"}
                                </h4>

                                {returnExchangeForm.type === "Return" ? (
                                  <p className="return-exchange-description">
                                    You can return this product and place a
                                    new order for the item you want instead.
                                    Please tell us why you would like to
                                    return it.
                                  </p>
                                ) : (
                                  <p className="return-exchange-description">
                                    Choose a different color or size for this
                                    product. Your replacement must have the
                                    same eligible price as your original
                                    purchase.
                                  </p>
                                )}

                                {returnExchangeForm.type === "Exchange" && (
                                  <div className="replacement-variant-field">
                                    {replacementVariantDetails ? (
                                      <div className="selected-replacement">
                                        <p>
                                          <strong>Your replacement</strong>
                                        </p>

                                        <p>
                                          Color:{" "}
                                          {replacementVariantDetails.color ||
                                            "N/A"}
                                        </p>

                                        <p>
                                          Size:{" "}
                                          {replacementVariantDetails.size ||
                                            "N/A"}
                                        </p>

                                        <p>
                                          Price: ₹
                                          {Number(
                                            replacementVariantDetails.price,
                                          ).toLocaleString("en-IN")}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="replacement-selection-hint">
                                        No replacement selected yet.
                                      </p>
                                    )}

                                    <button
                                      type="button"
                                      className="edit-profile-btn"
                                      onClick={() =>
                                        navigate(
                                          `/products/${item.productId}`,
                                          {
                                            state: {
                                              exchangeContext: {
                                                orderId: order._id,
                                                itemIndex: index,
                                                originalVariantId:
                                                  item.variantId,
                                                originalPrice: item.price,
                                                originalColor: item.color,
                                                productId: item.productId,
                                                reason: returnExchangeReason,
                                              },
                                            },
                                          },
                                        )
                                      }
                                    >
                                      {replacementVariantDetails
                                        ? "Change Replacement"
                                        : "Choose Replacement"}
                                    </button>
                                  </div>
                                )}

                                <label className="return-exchange-reason-label">
                                  Reason for{" "}
                                  {returnExchangeForm.type.toLowerCase()}
                                </label>

                                <textarea
                                  value={returnExchangeReason}
                                  onChange={(event) => {
                                    setReturnExchangeReason(
                                      event.target.value,
                                    );
                                    setReturnExchangeError("");
                                  }}
                                  placeholder={
                                    returnExchangeForm.type === "Return"
                                      ? "Why would you like to return this product?"
                                      : "Why would you like to exchange this product?"
                                  }
                                  rows={3}
                                  required
                                />

                                {returnExchangeError && (
                                  <p
                                    className="return-exchange-error"
                                    role="alert"
                                  >
                                    {returnExchangeError}
                                  </p>
                                )}

                                <div className="return-exchange-form-actions">
                                  <button
                                    type="submit"
                                    className="edit-profile-btn"
                                    disabled={
                                      returnExchangeLoading ||
                                      (returnExchangeForm.type === "Exchange" &&
                                        !selectedReplacementVariant)
                                    }
                                  >
                                    {returnExchangeLoading
                                      ? "Submitting..."
                                      : returnExchangeForm.type === "Return"
                                        ? "Submit Return Request"
                                        : "Submit Exchange Request"}
                                  </button>

                                  <button
                                    type="button"
                                    className="edit-profile-btn return-exchange-cancel-btn"
                                    onClick={() => {
                                      setReturnExchangeForm(null);
                                      setReturnExchangeReason("");
                                      setReturnExchangeError("");
                                      setSelectedReplacementVariant("");
                                      setReplacementVariantDetails(null);
                                    }}
                                    disabled={returnExchangeLoading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            )}
                        </div>
                      ))}
                    </div>

                    <div className="my-order-footer">
                      <p>
                        Total:{" "}
                        <strong>
                          ₹{Number(order.totalAmount).toFixed(2)}
                        </strong>
                      </p>

                      <button
                        className="edit-profile-btn"
                        onClick={() =>
                          navigate(`/orders/${order._id}/track`)
                        }
                      >
                        Track Order
                      </button>

                      {["Placed", "Confirmed"].includes(
                        order.orderStatus,
                      ) && (
                        <button
                          type="button"
                          className="edit-profile-btn"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : !showAddresses ? (
          <>
            <h1>My Profile</h1>

            <p className="profile-subtitle">
              Manage your personal information
            </p>

            <div className="profile-card">
              {/* ================= PROFILE IMAGE ================= */}

              <div className="profile-image-section">
                <div className="profile-image">
                  {user.profileImage && user.profileImage.length > 0 ? (
                    <img
                      src={user.profileImage[0]}
                      alt="Profile"
                    />
                  ) : (
                    <User size={55} />
                  )}
                </div>

                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  className="change-image"
                  onClick={openImageSelector}
                >
                  <Camera size={15} />
                  Change Photo
                </button>

                {user.profileImage && user.profileImage.length > 0 && (
                  <button
                    type="button"
                    className="remove-image"
                    onClick={handleRemoveProfileImage}
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* ================= PROFILE INFORMATION ================= */}

              <div className="profile-info">
                <div className="info-group">
                  <label>Name</label>
                  <p>{user.name}</p>
                </div>

                <div className="info-group">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>

                <button
                  className="edit-profile-btn"
                  onClick={openEditProfile}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ================= ADDRESS HEADER ================= */}

            <div className="address-header">
              <div>
                <h1>My Addresses</h1>

                <p className="profile-subtitle">
                  Manage your saved addresses
                </p>
              </div>

              <button
                className="add-address-btn"
                onClick={handleAddAddress}
              >
                <Plus size={18} />
                Add Address
              </button>
            </div>

            {/* ================= ADDRESS FORM ================= */}

            {showAddressForm && (
              <div className="address-form-card">
                <h2>
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h2>

                <form onSubmit={handleAddressSubmit}>
                  <div className="address-form-grid">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={addressForm.fullName}
                      onChange={handleAddressChange}
                      required
                    />

                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone Number"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      required
                    />

                    <input
                      type="text"
                      name="addressLine"
                      placeholder="Address"
                      value={addressForm.addressLine}
                      onChange={handleAddressChange}
                      required
                    />

                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      required
                    />

                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      required
                    />

                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>

                  <div className="address-type">
                    <label>Address Type</label>

                    <select
                      name="addressType"
                      value={addressForm.addressType}
                      onChange={handleAddressChange}
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <label className="default-checkbox">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={addressForm.isDefault}
                      onChange={handleAddressChange}
                    />
                    Set as default address
                  </label>

                  <div className="address-form-buttons">
                    <button type="submit">
                      <Check size={17} />
                      {editingAddressId ? "Update Address" : "Save Address"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                        resetAddressForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= ADDRESS LIST ================= */}

            <div className="address-list">
              {addresses.length === 0 ? (
                <div className="empty-address">
                  <MapPin size={40} />

                  <p>No addresses saved yet.</p>

                  <button onClick={handleAddAddress}>
                    <Plus size={17} />
                    Add Your First Address
                  </button>
                </div>
              ) : (
                addresses.map((address) => (
                  <div className="address-card" key={address._id}>
                    <div className="address-card-top">
                      <div>
                        <h3>{address.addressType}</h3>

                        {address.isDefault && (
                          <span className="default-badge">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    <p>
                      <strong>{address.fullName}</strong>
                    </p>

                    <p>{address.phone}</p>

                    <p>{address.addressLine}</p>

                    <p>
                      {address.city}, {address.state} - {address.pincode}
                    </p>

                    <div className="address-actions">
                      <button
                        onClick={() => handleEditAddress(address)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>

                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address._id)}
                        >
                          <Check size={14} />
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* ================= EDIT PROFILE MODAL ================= */}

      {showEditProfile && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>Edit Profile</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditProfile(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="profile-form-group">
                <label>Name</label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="profile-modal-buttons">
                <button type="submit" disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEditProfile(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CHANGE PROFILE PHOTO MODAL ================= */}

      {showImageModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal image-preview-modal">
            <div className="profile-modal-header">
              <h2>Change Profile Photo</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeImageModal}
                disabled={formLoading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="image-preview-container">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="image-preview"
                />
              )}
            </div>

            <p className="image-preview-info">
              Make sure you are happy with this photo before saving.
            </p>

            <div className="profile-modal-buttons">
              <button
                type="button"
                onClick={handleSaveProfileImage}
                disabled={formLoading}
              >
                {formLoading ? "Saving..." : "Save Photo"}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={closeImageModal}
                disabled={formLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHANGE EMAIL MODAL ================= */}

      {showChangeEmail && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>Change Email</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeChangeEmail}
              >
                <X size={20} />
              </button>
            </div>

            {!emailOtpSent ? (
              <form onSubmit={handleSendEmailOtp}>
                <div className="profile-form-group">
                  <label>Current Email</label>

                  <input type="email" value={user.email} disabled />
                </div>

                <div className="profile-form-group">
                  <label>New Email</label>

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                  />
                </div>

                <div className="profile-modal-buttons">
                  <button type="submit" disabled={formLoading}>
                    {formLoading ? "Sending..." : "Send OTP"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeChangeEmail}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp}>
                <p className="otp-info">
                  OTP has been sent to:
                  <br />
                  <strong>{newEmail}</strong>
                </p>

                <div className="profile-form-group">
                  <label>Enter OTP</label>

                  <input
                    type="text"
                    value={emailOtp}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(e) =>
                      setEmailOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter 6-digit OTP"
                  />
                </div>

                <div className="profile-modal-buttons">
                  <button type="submit" disabled={formLoading}>
                    {formLoading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeChangeEmail}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= CHANGE PASSWORD MODAL ================= */}

      {showChangePassword && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>Change Password</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeChangePassword}
              >
                <X size={20} />
              </button>
            </div>

            {!passwordOtpSent ? (
              <form onSubmit={handleSendPasswordOtp}>
                <div className="profile-form-group">
                  <label>Current Password</label>

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="profile-form-group">
                  <label>New Password</label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="profile-form-group">
                  <label>Confirm New Password</label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <p className="password-hint">
                  Password must be 8-20 characters and include uppercase,
                  lowercase, number and special character.
                </p>

                <div className="profile-modal-buttons">
                  <button type="submit" disabled={formLoading}>
                    {formLoading ? "Sending..." : "Send OTP"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeChangePassword}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPasswordOtp}>
                <p className="otp-info">
                  OTP has been sent to your registered email address.
                </p>

                <div className="profile-form-group">
                  <label>Enter OTP</label>

                  <input
                    type="text"
                    value={passwordOtp}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(e) =>
                      setPasswordOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter 6-digit OTP"
                  />
                </div>

                <div className="profile-modal-buttons">
                  <button type="submit" disabled={formLoading}>
                    {formLoading
                      ? "Verifying..."
                      : "Verify & Change Password"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeChangePassword}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= NOTIFICATION MODAL ================= */}

      <NotificationModal
        isOpen={showNotification}
        onClose={handleNotificationClose}
        title={notificationTitle}
        message={notificationMessage}
        type={notificationType}
      />

      {/* ================= CONFIRMATION MODAL ================= */}

      <ConfirmationModal
        isOpen={showConfirmation}
        onCancel={handleConfirmationCancel}
        onConfirm={handleConfirmationConfirm}
        title={confirmationTitle}
        message={confirmationMessage}
        confirmText={confirmationText}
        cancelText="Cancel"
      />
    </div>
  );
}

export default UserProfile;