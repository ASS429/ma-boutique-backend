const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");

// Middleware admin
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
}

/**
 * POST /admin-transfers
 * Crée un transfert interne entre comptes
 */
router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount || from === to) {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    // Enregistrer le transfert
    const q = await db.query(
      `INSERT INTO admin_transfers (admin_id, from_account, to_account, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, from, to, amount]
    );

    res.json({ message: "✅ Transfert enregistré", transfer: q.rows[0] });
  } catch (err) {
    console.error("❌ Erreur transfert:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /admin-transfers
 * Liste des transferts internes de l’admin
 */
router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const q = await db.query(
      `SELECT * FROM admin_transfers
       WHERE admin_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(q.rows);
  } catch (err) {
    console.error("❌ Erreur liste transferts:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
