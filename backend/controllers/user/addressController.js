
const mongoose = require("mongoose");
const Address = require("../../models/Address");

// ================= ADDRESS VALIDATION =================

const validateAddress = (data) => {
    const {
        fullName,
        phone,
        addressLine,
        city,
        state,
        pincode,
        addressType,
    } = data;

    const errors = {};

    const name = typeof fullName === "string" ? fullName.trim() : "";
    const mobile = typeof phone === "string" ? phone.trim() : "";
    const line = typeof addressLine === "string" ? addressLine.trim() : "";
    const cityName = typeof city === "string" ? city.trim() : "";
    const stateName = typeof state === "string" ? state.trim() : "";
    const pin = typeof pincode === "string" ? pincode.trim() : "";

    // Full name
    if (!name) {
        errors.fullName = "Full name is required.";
    } else if (name.length < 3 || name.length > 60) {
        errors.fullName = "Name must be between 3 and 60 characters.";
    } else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(name)) {
        errors.fullName = "Enter a valid name using letters only.";
    }

    // Indian mobile number
    if (!mobile) {
        errors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
        errors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    // Address line
    if (!line) {
        errors.addressLine = "Address is required.";
    } else if (line.length < 5 || line.length > 200) {
        errors.addressLine = "Address must be between 5 and 200 characters.";
    } else if (!/[A-Za-z0-9]/.test(line)) {
        errors.addressLine = "Enter a valid house or street address.";
    }

    // City
    if (!cityName) {
        errors.city = "City is required.";
    } else if (
        cityName.length > 60 ||
        !/^[A-Za-z][A-Za-z\s.'-]*$/.test(cityName)
    ) {
        errors.city = "Enter a valid city name.";
    }

    // State
    if (!stateName) {
        errors.state = "State is required.";
    } else if (
        stateName.length > 60 ||
        !/^[A-Za-z][A-Za-z\s.'-]*$/.test(stateName)
    ) {
        errors.state = "Enter a valid state name.";
    }

    // Indian PIN code
    if (!pin) {
        errors.pincode = "Pincode is required.";
    } else if (!/^[1-9]\d{5}$/.test(pin)) {
        errors.pincode = "Enter a valid 6-digit Indian pincode.";
    }

    // Address type
    if (
        addressType !== undefined &&
        !["Home", "Work", "Other"].includes(addressType)
    ) {
        errors.addressType = "Address type must be Home, Work, or Other.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        cleanedAddress: {
            fullName: name,
            phone: mobile,
            addressLine: line,
            city: cityName,
            state: stateName,
            pincode: pin,
            addressType: addressType || "Home",
        },
    };
};

// ================= ADD ADDRESS =================

const addAddress = async (req, res) => {
    try {
        const {
            isDefault,
        } = req.body;

        const validation = validateAddress(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Please correct the address details.",
                errors: validation.errors,
            });
        }

        const addressCount = await Address.countDocuments({
            userId: req.userId,
        });

        const makeDefault = addressCount === 0 || isDefault === true;

        if (makeDefault) {
            await Address.updateMany(
                { userId: req.userId },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.create({
            userId: req.userId,
            ...validation.cleanedAddress,
            isDefault: makeDefault,
        });

        return res.status(201).json({
            success: true,
            message: "Address added successfully.",
            address,
        });
    } catch (error) {
        console.error("Add address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add address.",
        });
    }
};

// ================= GET ADDRESSES =================

const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({
            userId: req.userId,
        }).sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            addresses,
        });
    } catch (error) {
        console.error("Get addresses error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get addresses.",
        });
    }
};

// ================= UPDATE ADDRESS =================

const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { isDefault } = req.body;

        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID.",
            });
        }

        const validation = validateAddress(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Please correct the address details.",
                errors: validation.errors,
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            userId: req.userId,
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found.",
            });
        }

        if (isDefault === true) {
            await Address.updateMany(
                {
                    userId: req.userId,
                    _id: { $ne: addressId },
                },
                { $set: { isDefault: false } }
            );

            address.isDefault = true;
        }

        Object.assign(address, validation.cleanedAddress);

        await address.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully.",
            address,
        });
    } catch (error) {
        console.error("Update address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update address.",
        });
    }
};

// ================= DELETE ADDRESS =================

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID.",
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            userId: req.userId,
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found.",
            });
        }

        const wasDefault = address.isDefault;

        await Address.deleteOne({
            _id: addressId,
            userId: req.userId,
        });

        if (wasDefault) {
            const nextAddress = await Address.findOne({
                userId: req.userId,
            }).sort({ createdAt: -1 });

            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully.",
        });
    } catch (error) {
        console.error("Delete address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete address.",
        });
    }
};

// ================= SET DEFAULT ADDRESS =================

const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID.",
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            userId: req.userId,
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found.",
            });
        }

        await Address.updateMany(
            { userId: req.userId },
            { $set: { isDefault: false } }
        );

        address.isDefault = true;
        await address.save();

        return res.status(200).json({
            success: true,
            message: "Default address updated successfully.",
            address,
        });
    } catch (error) {
        console.error("Set default address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to set default address.",
        });
    }
};

module.exports = {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
