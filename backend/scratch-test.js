import jwt from "jsonwebtoken";
import axios from "axios";

const token = jwt.sign({ user_id: 4 }, "your_jwt_secret_key");
axios.post("http://localhost:5000/api/ai/generate-plan", {}, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => console.log("SUCCESS:", res.data))
.catch(err => console.error("ERROR:", err.response ? err.response.data : err.message));
