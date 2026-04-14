import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";

// ================= GET PROFILE =================
export const getUserProfile = async (req, res) => {
  const userId = req.user.id;

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
  const userId = req.user.id;

  try {
    let profilePicUrl;

    // ✅ Upload image to Cloudinary
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_pics" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      profilePicUrl = uploadResult.secure_url;
    }

    // ✅ Email check
    if (req.body.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: req.body.email,
          NOT: { user_id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // ✅ Phone check
    if (req.body.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: req.body.phone,
          NOT: { user_id: userId }
        }
      });

      if (existingPhone) {
        return res.status(400).json({ message: "Phone already in use" });
      }
    }

    // ✅ Update user
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

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};