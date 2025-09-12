// middleware/auth.js
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  console.log("🔍 Authorization header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token manquant" });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.error("❌ JWT verify error:", err);
      return res.status(403).json({ message: "Token invalide" });
    }
    req.user = payload;
    next();
  });
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès réservé aux administrateurs" });
  }
  next();
}

module.exports = { authenticateToken, isAdmin };
