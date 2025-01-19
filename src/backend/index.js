const express = require("express");
const cors = require("cors");
const mongoDB = require('./db');
mongoDB();

const app = express();
const port = 5000;

// CORS Middleware
app.use(cors({ origin: "http://localhost:3000" }));

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use("/api", require("./Routes/CreateUser"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);

  if (!res.headersSent) {
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
