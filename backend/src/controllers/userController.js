import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";

// ================= GET PROFILE =================
export const getUserProfile = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        gender: true,
        phone: true,
        profile_pic: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE PROFILE =================
export const updateUserProfile = async (req, res) => {
  const userId = req.user?.user_id;
  console.log("=== UPDATE PROFILE START ===");
  console.log("userId:", userId);
  console.log("body:", req.body);
  console.log("file:", req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : "No file");

  try {
    let profilePicUrl;

    // ✅ Upload image to Cloudinary
    if (req.file) {
      console.log("Uploading file to cloudinary...");
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_pics" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            }
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      console.log("Cloudinary upload success:", uploadResult.secure_url);
      profilePicUrl = uploadResult.secure_url;
    }

    // ✅ Email check
    if (req.body.email) {
      console.log("Checking email uniqueness for:", req.body.email);
      const existingUser = await prisma.user.findFirst({
        where: {
          email: req.body.email,
          NOT: { user_id: userId }
        }
      });

      if (existingUser) {
        console.log("Email already in use:", req.body.email);
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // ✅ Phone check
    if (req.body.phone) {
      console.log("Checking phone uniqueness for:", req.body.phone);
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: req.body.phone,
          NOT: { user_id: userId }
        }
      });

      if (existingPhone) {
        console.log("Phone already in use:", req.body.phone);
        return res.status(400).json({ message: "Phone already in use" });
      }
    }

    // ✅ Update user
    console.log("Updating database record for user_id:", userId);
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        gender: req.body.gender,
        ...(profilePicUrl && { profile_pic: profilePicUrl })
      }
    });

    console.log("Database update successful:", updatedUser);
    console.log("=== UPDATE PROFILE END SUCCESS ===");
    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("=== UPDATE PROFILE ERROR ===");
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};