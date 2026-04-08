const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");

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

    // Hash the password before storing it    
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password_hash: passwordHash }
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

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
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