const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/auth");

// ✅ Récupérer les alertes de paiements
router.get("/alerts", verifyToken, async (req, res) => {
  try {
    const late = await pool.query(
      `SELECT id, username, expiration, CURRENT_DATE - expiration AS days_late
       FROM users
       WHERE plan = 'Premium' AND expiration < CURRENT_DATE`
    );

    const upcoming = await pool.query(
      `SELECT id, username, expiration, expiration - CURRENT_DATE AS days_left
       FROM users
       WHERE plan = 'Premium' 
         AND expiration BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'`
    );

    const alerts = [];

    // Paiements en retard
    late.rows.forEach(u => {
      alerts.push({
        id: `late-${u.id}`,
        name: u.username,
        type: "late",
        message: `Paiement en retard de ${u.days_late} jours`
      });
    });

    // Paiements bientôt dus
    upcoming.rows.forEach(u => {
      alerts.push({
        id: `upcoming-${u.id}`,
        name: u.username,
        type: "upcoming",
        message: `Paiement dû dans ${u.days_left} jours`
      });
    });

    res.json(alerts);
  } catch (err) {
    console.error("❌ Erreur GET /alerts:", err);
    res.status(500).json({ error: "Impossible de charger les alertes" });
  }
});

module.exports = router;
