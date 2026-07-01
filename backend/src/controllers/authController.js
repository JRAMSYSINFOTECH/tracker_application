import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

// Signup
export const signup = async (req, res) => {

  const { name, email, password, gender } = req.body;

  const emailLower = email.toLowerCase();

  try {

    const existing = await prisma.user.findUnique({
      where: { email: emailLower }
    });

    if (existing) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    let profilePicUrl = null;

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          message: "Profile image upload is not configured on the backend"
        });
      }

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

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        password_hash: hashedPassword,
        gender,
        profile_pic: profilePicUrl
      }
    });

    // ✅ TOKEN GENERATION
    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({

      message:
        "User registered successfully",

      token,

      userId: user.user_id,

      name: user.name,

      email: user.email,

      gender: user.gender,

      profile_pic: user.profile_pic
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
};

// Login
export const login = async (req, res) => {

  const { email, password } = req.body;

  const emailLower = email.toLowerCase();

  try {

    const user =
      await prisma.user.findUnique({
        where: { email: emailLower }
      });

    if (!user) {

      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!isMatch) {

      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,

      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        profile_pic: user.profile_pic
      },
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
};

// Google Mobile Login
export const googleMobileLogin = async (
  req,
  res
) => {

  const {
    email,
    name,
    googleId,
    profile_pic
  } = req.body;

  try {

    let user =
      await prisma.user.findUnique({
        where: {
          email: email.toLowerCase()
        }
      });

    // Create user if not exists

    if (!user) {

      user =
        await prisma.user.create({

          data: {

            name,

            email: email.toLowerCase(),

            googleId,

            profile_pic:
              profile_pic || null,

            password_hash:
              "GOOGLE_AUTH_USER",
          }
        });
    }

    // Generate JWT

    const token = jwt.sign(
      {
        user_id: user.user_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({

      message:
        "Google login successful",

      token,

      user: {

        user_id:
          user.user_id,

        name:
          user.name,

        email:
          user.email,

        profile_pic:
          user.profile_pic,
      }
    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });
  }
};

// Update User Profile
export const updateUserProfile = async (
  req,
  res
) => {

  const userId = req.user.user_id;

  const {
    name,
    email,
    phone,
    gender
  } = req.body;

  try {

    if (phone) {

      const existingUser =
        await prisma.user.findFirst({

          where: {
            phone: phone,

            NOT: {
              user_id: userId
            }
          }
        });

      if (existingUser) {

        return res.status(400).json({
          message:
            "Phone number already in use"
        });
      }
    }

    const updatedUser =
      await prisma.user.update({

        where: {
          user_id: userId
        },

        data: {
          name,
          email,
          phone,
          gender
        }
      });

    res.json({

      message:
        "Profile updated successfully",

      user: updatedUser
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
};
