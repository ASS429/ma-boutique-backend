const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/auth");

// ✅ Récupérer les alertes (lecture seule)
router.get("/", verifyToken, async (req, res) => {
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

// ✅ Recalculer les alertes manuellement (admin only)
router.post("/refresh", verifyToken, async (req, res) => {
  try {
    console.log("🔄 Rafraîchissement manuel des alertes...");

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
        [u.id, `Paiement dû dans ${u.days_left} jours`, u.days_left]
      );
    }

    console.log("✅ Rafraîchissement manuel terminé !");
    res.json({ message: "✅ Alertes recalculées avec succès" });
  } catch (err) {
    console.error("❌ Erreur POST /alerts/refresh:", err);
    res.status(500).json({ error: "Impossible de recalculer les alertes" });
  }
});

module.exports = router;
