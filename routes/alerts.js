// routes/alerts.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/auth");

// ✅ Recalculer les alertes et stocker en base
router.post("/refresh", verifyToken, async (req, res) => {
  try {
    // Vider les anciennes alertes
    await pool.query("DELETE FROM alerts");

    // Paiements en retard
    const late = await pool.query(
      `SELECT id, username, expiration, CURRENT_DATE - expiration AS days_late
       FROM users
       WHERE plan = 'Premium' AND expiration < CURRENT_DATE`
    );

    for (const u of late.rows) {
      await pool.query(
        `INSERT INTO alerts (user_id, type, message, days)
         VALUES ($1, 'late', $2, $3)`,
        [u.id, `Paiement en retard de ${u.days_late} jours`, u.days_late]
      );
    }

    // Paiements bientôt dus
    const upcoming = await pool.query(
      `SELECT id, username, expiration, expiration - CURRENT_DATE AS days_left
       FROM users
       WHERE plan = 'Premium'
         AND expiration BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'`
    );

    for (const u of upcoming.rows) {
      await pool.query(
        `INSERT INTO alerts (user_id, type, message, days)
         VALUES ($1, 'upcoming', $2, $3)`,
        [u.id, \`Paiement dû dans ${u.days_left} jours\`, u.days_left]
      );
    }

    res.json({ message: "✅ Alertes recalculées et enregistrées" });
  } catch (err) {
    console.error("❌ Erreur refresh alerts:", err);
    res.status(500).json({ error: "Erreur recalcul alertes" });
  }
});

// ✅ Récupérer les alertes actuelles
router.get("/", verifyToken, async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50`
    );
    res.json(q.rows);
  } catch (err) {
    console.error("❌ Erreur GET /alerts:", err);
    res.status(500).json({ error: "Impossible de charger les alertes" });
  }
});

module.exports = router;
