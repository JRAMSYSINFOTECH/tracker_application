import "dotenv/config";
import app from "./src/app.js";
import open from "open";

const PORT = process.env.PORT || 5000;
const shouldOpenBrowser = process.env.OPEN_BROWSER === "true";

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  if (shouldOpenBrowser) {
    open(`http://localhost:${PORT}`);
  }
});
