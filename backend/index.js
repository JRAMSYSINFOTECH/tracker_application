import dotenv from "dotenv";
dotenv.config();
console.log("Cloudinary Name:", process.env.CLOUDINARY_CLOUD_NAME);

import app from "./src/app.js";
import open from "open";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  open(`http://localhost:${PORT}`);
});