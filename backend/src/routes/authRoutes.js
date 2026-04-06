const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//here if routes are not working means please check and change the route

router.post("/signup", authController.signup);
router.post("/login", authController.login);

module.exports = router;