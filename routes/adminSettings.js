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

// ✅ Récupérer les paramètres
router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const q = await db.query(
      `SELECT * FROM admin_settings WHERE admin_id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (q.rows.length === 0) {
      // Si aucun paramètre existant, créer une ligne par défaut
      const insert = await db.query(
        `INSERT INTO admin_settings (admin_id) VALUES ($1) RETURNING *`,
        [req.user.id]
      );
      return res.json(insert.rows[0]);
    }

    res.json(q.rows[0]);
  } catch (err) {
    console.error("❌ Erreur GET settings:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mettre à jour les paramètres
router.put("/", verifyToken, isAdmin, async (req, res) => {
  const {
    app_name,
    contact_email,
    timezone,
    premium_price,
    grace_period,
    auto_alerts,
    notify_new_sub,
    notify_late_pay,
    notify_reports,
    allow_multi_sessions,
  } = req.body;

  try {
    const q = await db.query(
      `UPDATE admin_settings
       SET app_name = $1,
           contact_email = $2,
           timezone = $3,
           premium_price = $4,
           grace_period = $5,
           auto_alerts = $6,
           notify_new_sub = $7,
           notify_late_pay = $8,
           notify_reports = $9,
           allow_multi_sessions = $10,
           updated_at = NOW()
       WHERE admin_id = $11
       RETURNING *`,
      [
        app_name,
        contact_email,
        timezone,
        premium_price,
        grace_period,
        auto_alerts,
        notify_new_sub,
        notify_late_pay,
        notify_reports,
        allow_multi_sessions,
        req.user.id,
      ]
    );

    res.json({ message: "✅ Paramètres mis à jour", settings: q.rows[0] });
  } catch (err) {
    console.error("❌ Erreur PUT settings:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
