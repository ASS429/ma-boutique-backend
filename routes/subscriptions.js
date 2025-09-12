const express = require("express");
const router = express.Router();
const pool = require("../db");

// ⚡️ Importer les middlewares depuis le bon fichier
// Vérifie bien le chemin : souvent ils sont dans un dossier `middleware/`
const { authenticateToken, isAdmin } = require("../middleware/auth"); 

// 📌 Récupérer tous les abonnements Premium (admin uniquement)
router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.amount, s.payment_method, s.paid_at, s.expiration, s.status,
             u.username, u.phone
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.paid_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur GET /subscriptions :", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Enregistrer un nouveau paiement Premium
router.post("/", authenticateToken, async (req, res) => {
  const { payment_method, amount, expiration } = req.body;
  const userId = req.user?.id;

  if (!payment_method || !amount || !expiration) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, amount, payment_method, expiration, status)
       VALUES ($1, $2, $3, $4, 'en_attente')
       RETURNING *`,
      [userId, amount, payment_method, expiration]
    );

    res.status(201).json({
      message: "Paiement Premium enregistré",
      subscription: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Erreur POST /subscriptions :", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
