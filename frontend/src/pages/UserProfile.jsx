import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
} from "lucide-react";

import NotificationModal from "../components/common/NotificationModal";
import ConfirmationModal from "../components/common/ConfirmationModal";

import "./UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();

  // ================= USER =================

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= ADDRESSES =================

  const [addresses, setAddresses] = useState([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

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
  }, []);

  // ================= NOTIFICATION FUNCTIONS =================

  const showNotificationMessage = (
    title,
    message,
    type = "success"
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
    confirmText = "Confirm"
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
      const token = localStorage.getItem("userToken");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/user/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
      } else {
        console.error(data.message);

        showNotificationMessage(
          "Profile Error",
          data.message || "Unable to load profile.",
          "error"
        );
      }
    } catch (error) {
      console.error("Profile fetch error:", error);

      showNotificationMessage(
        "Profile Error",
        "Something went wrong while loading your profile.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EDIT PROFILE
  // =========================================================

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
        "error"
      );
      return;
    }

    setFormLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      const response = await fetch(
        "http://localhost:5001/api/user/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setShowEditProfile(false);

        showNotificationMessage(
          "Profile Updated",
          "Your profile has been updated successfully.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Update Failed",
          data.message || "Unable to update your profile.",
          "error"
        );
      }
    } catch (error) {
      console.error("Update profile error:", error);

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to update your profile. Please try again.",
        "error"
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // CHANGE PROFILE PHOTO
  // =========================================================

  const openImageSelector = () => {
    const imageInput = document.getElementById(
      "profile-image-input"
    );

    if (imageInput) {
      imageInput.click();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Only allow image files
    if (!file.type.startsWith("image/")) {
      showNotificationMessage(
        "Invalid Image",
        "Please select a valid image file.",
        "error"
      );

      e.target.value = "";
      return;
    }

    // Maximum image size: 2 MB
    if (file.size > 2 * 1024 * 1024) {
      showNotificationMessage(
        "Image Too Large",
        "Please select an image smaller than 2 MB.",
        "error"
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
      const token = localStorage.getItem("userToken");

      if (!token) {
        showNotificationMessage(
          "Authentication Required",
          "Please login again to continue.",
          "error"
        );

        setFormLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/user/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: user.name,
            profileImage: [imagePreview],
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);

        setSelectedImage(null);
        setImagePreview(null);
        setShowImageModal(false);

        const imageInput = document.getElementById(
          "profile-image-input"
        );

        if (imageInput) {
          imageInput.value = "";
        }

        showNotificationMessage(
          "Photo Updated",
          "Your profile photo has been updated successfully.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Upload Failed",
          data.message ||
            "Unable to update your profile photo.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Profile image update error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to update your profile photo. Please try again.",
        "error"
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

    const imageInput = document.getElementById(
      "profile-image-input"
    );

    if (imageInput) {
      imageInput.value = "";
    }
  };

  // ================= REMOVE PROFILE PHOTO =================

  const handleRemoveProfileImage = () => {
    showConfirmationMessage(
      "Remove Profile Photo?",
      "Are you sure you want to remove your profile photo?",
      removeProfileImage,
      "Remove"
    );
  };

  const removeProfileImage = async () => {
    setFormLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        showNotificationMessage(
          "Authentication Required",
          "Please login again to continue.",
          "error"
        );

        setFormLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/user/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: user.name,
            profileImage: [],
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);

        showNotificationMessage(
          "Photo Removed",
          "Your profile photo has been removed successfully.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Remove Failed",
          data.message ||
            "Unable to remove your profile photo.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Remove profile image error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to remove your profile photo. Please try again.",
        "error"
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // CHANGE EMAIL
  // =========================================================

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
        "error"
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showNotificationMessage(
        "Invalid Email",
        "Please enter a valid email address.",
        "error"
      );
      return;
    }

    setFormLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      const response = await fetch(
        "http://localhost:5001/api/user/change-email/send-otp",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEmail: email,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setNewEmail(email);
        setEmailOtpSent(true);

        showNotificationMessage(
          "OTP Sent",
          "OTP has been sent to your new email address.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Email Change Failed",
          data.message || "Unable to send OTP.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Send email OTP error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to send OTP. Please try again.",
        "error"
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
        "error"
      );
      return;
    }

    setFormLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      const response = await fetch(
        "http://localhost:5001/api/user/change-email/verify-otp",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEmail: newEmail.trim().toLowerCase(),
            otp: emailOtp,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
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
          "success"
        );
      } else {
        showNotificationMessage(
          "Verification Failed",
          data.message || "Invalid OTP.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Verify email OTP error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to verify OTP. Please try again.",
        "error"
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

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

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

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      showNotificationMessage(
        "Missing Information",
        "Please fill in all password fields.",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotificationMessage(
        "Password Mismatch",
        "New password and confirm password do not match.",
        "error"
      );
      return;
    }

    setFormLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      const response = await fetch(
        "http://localhost:5001/api/user/change-password/send-otp",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordOtpSent(true);

        showNotificationMessage(
          "OTP Sent",
          "OTP has been sent to your registered email address.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Password Change Failed",
          data.message || "Unable to send OTP.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Send password OTP error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to send OTP. Please try again.",
        "error"
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
        "error"
      );
      return;
    }

    setFormLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      const response = await fetch(
        "http://localhost:5001/api/user/change-password/verify-otp",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otp: passwordOtp,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setShowChangePassword(false);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
        setPasswordOtpSent(false);

        showNotificationMessage(
          "Password Changed",
          "Your password has been changed successfully.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Verification Failed",
          data.message || "Invalid OTP.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Verify password OTP error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to verify OTP. Please try again.",
        "error"
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

  // =========================================================
  // GET ADDRESSES
  // =========================================================

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/user/addresses",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setAddresses(data.addresses);
      } else {
        console.error(data.message);

        showNotificationMessage(
          "Address Error",
          data.message || "Unable to load addresses.",
          "error"
        );
      }
    } catch (error) {
      console.error("Address fetch error:", error);

      showNotificationMessage(
        "Address Error",
        "Something went wrong while loading addresses.",
        "error"
      );
    }
  };

  // ================= OPEN ADDRESSES =================

  const handleAddresses = () => {
    setShowAddresses(true);
    fetchAddresses();
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
      const token = localStorage.getItem("userToken");

      if (!token) {
        showNotificationMessage(
          "Authentication Required",
          "Please login again to continue.",
          "error"
        );
        return;
      }

      const url = editingAddressId
        ? `http://localhost:5001/api/user/addresses/${editingAddressId}`
        : "http://localhost:5001/api/user/addresses";

      const method = editingAddressId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressForm),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const wasEditing = Boolean(editingAddressId);

        setShowAddressForm(false);
        setEditingAddressId(null);
        resetAddressForm();

        fetchAddresses();

        showNotificationMessage(
          wasEditing
            ? "Address Updated"
            : "Address Added",
          data.message ||
            (wasEditing
              ? "Your address has been updated successfully."
              : "Your address has been added successfully."),
          "success"
        );
      } else {
        showNotificationMessage(
          "Address Error",
          data.message || "Unable to save address.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Address submit error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to save the address. Please try again.",
        "error"
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

  const deleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        showNotificationMessage(
          "Authentication Required",
          "Please login again to continue.",
          "error"
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/user/addresses/${addressId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        fetchAddresses();

        showNotificationMessage(
          "Address Deleted",
          data.message ||
            "The address has been deleted successfully.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Delete Failed",
          data.message || "Unable to delete the address.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Delete address error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to delete the address. Please try again.",
        "error"
      );
    }
  };

  // ================= DELETE CONFIRMATION =================

  const handleDeleteAddress = (addressId) => {
    showConfirmationMessage(
      "Delete Address?",
      "Are you sure you want to delete this address?",
      () => deleteAddress(addressId),
      "Delete"
    );
  };

  // ================= SET DEFAULT =================

  const handleSetDefault = async (addressId) => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        showNotificationMessage(
          "Authentication Required",
          "Please login again to continue.",
          "error"
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/user/addresses/${addressId}/default`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        fetchAddresses();

        showNotificationMessage(
          "Default Address Updated",
          data.message ||
            "Your default address has been updated.",
          "success"
        );
      } else {
        showNotificationMessage(
          "Update Failed",
          data.message || "Unable to set default address.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Set default error:",
        error
      );

      showNotificationMessage(
        "Something Went Wrong",
        "Unable to update the default address.",
        "error"
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
      "Logout"
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
            !showAddresses ? "active" : ""
          }`}
          onClick={() => setShowAddresses(false)}
        >
          <User size={18} />
          <span>Profile</span>
        </button>

        <button className="sidebar-item">
          <Package size={18} />
          <span>My Orders</span>
        </button>

        <button className="sidebar-item">
          <Heart size={18} />
          <span>Wishlist</span>
        </button>

        <button
          className={`sidebar-item ${
            showAddresses ? "active" : ""
          }`}
          onClick={handleAddresses}
        >
          <MapPin size={18} />
          <span>Addresses</span>
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

        {!showAddresses ? (

          <>
            <h1>My Profile</h1>

            <p className="profile-subtitle">
              Manage your personal information
            </p>

            <div className="profile-card">

              {/* ================= PROFILE IMAGE ================= */}

              <div className="profile-image-section">

                <div className="profile-image">

                  {user.profileImage &&
                  user.profileImage.length > 0 ? (
                    <img
                      src={user.profileImage[0]}
                      alt="Profile"
                    />
                  ) : (
                    <User size={55} />
                  )}

                </div>

                {/* Hidden file input */}

                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />

                {/* Change Photo */}

                <button
                  type="button"
                  className="change-image"
                  onClick={openImageSelector}
                >
                  <Camera size={15} />
                  Change Photo
                </button>

                {/* Remove Photo */}

                {user.profileImage &&
                  user.profileImage.length > 0 && (
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
                  {editingAddressId
                    ? "Edit Address"
                    : "Add New Address"}
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
                      {editingAddressId
                        ? "Update Address"
                        : "Save Address"}
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

                  <div
                    className="address-card"
                    key={address._id}
                  >

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
                      {address.city}, {address.state} -{" "}
                      {address.pincode}
                    </p>

                    <div className="address-actions">

                      <button
                        onClick={() =>
                          handleEditAddress(address)
                        }
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteAddress(address._id)
                        }
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>

                      {!address.isDefault && (
                        <button
                          onClick={() =>
                            handleSetDefault(address._id)
                          }
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

      {/* =====================================================
          EDIT PROFILE MODAL
      ===================================================== */}

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
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                  placeholder="Enter your name"
                />

              </div>

              <div className="profile-modal-buttons">

                <button
                  type="submit"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowEditProfile(false)
                  }
                  disabled={formLoading}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          CHANGE PROFILE PHOTO MODAL
      ===================================================== */}

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
                {formLoading
                  ? "Saving..."
                  : "Save Photo"}
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

      {/* =====================================================
          CHANGE EMAIL MODAL
      ===================================================== */}

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

                  <input
                    type="email"
                    value={user.email}
                    disabled
                  />

                </div>

                <div className="profile-form-group">

                  <label>New Email</label>

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) =>
                      setNewEmail(e.target.value)
                    }
                    placeholder="Enter new email"
                  />

                </div>

                <div className="profile-modal-buttons">

                  <button
                    type="submit"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Sending..."
                      : "Send OTP"}
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
                      setEmailOtp(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="Enter 6-digit OTP"
                  />

                </div>

                <div className="profile-modal-buttons">

                  <button
                    type="submit"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Verifying..."
                      : "Verify OTP"}
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

      {/* CHANGE PASSWORD MODAL */}

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
                    onChange={(e) =>
                      setCurrentPassword(e.target.value)
                    }
                    placeholder="Enter current password"
                  />

                </div>

                <div className="profile-form-group">

                  <label>New Password</label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Enter new password"
                  />

                </div>

                <div className="profile-form-group">

                  <label>Confirm New Password</label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm new password"
                  />

                </div>

                <p className="password-hint">
                  Password must be 8-20 characters and include
                  uppercase, lowercase, number and special character.
                </p>

                <div className="profile-modal-buttons">

                  <button
                    type="submit"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Sending..."
                      : "Send OTP"}
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
                      setPasswordOtp(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="Enter 6-digit OTP"
                  />

                </div>

                <div className="profile-modal-buttons">

                  <button
                    type="submit"
                    disabled={formLoading}
                  >
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