const prisma = require("../config/prisma");

// please fin d the SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await prisma.user.create({
      data: { name, email, password_hash: password }
    });

    res.json({
      message: "User created successfully",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// please find the LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};