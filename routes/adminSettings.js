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
    alerts_enabled,
    notify_new_subs,
    notify_late_payments,
    notify_reports,
    multi_sessions,
  } = req.body;

  try {
    const q = await db.query(
      `UPDATE admin_settings
       SET app_name = $1,
           contact_email = $2,
           timezone = $3,
           premium_price = $4,
           grace_period = $5,
           alerts_enabled = $6,
           notify_new_subs = $7,
           notify_late_payments = $8,
           notify_reports = $9,
           multi_sessions = $10,
           updated_at = NOW()
       WHERE admin_id = $11
       RETURNING *`,
      [
        app_name,
        contact_email,
        timezone,
        premium_price,
        grace_period,
        alerts_enabled,
        notify_new_subs,
        notify_late_payments,
        notify_reports,
        multi_sessions,
        req.user.id,
      ]
    );

    res.json({ message: "✅ Paramètres mis à jour", settings: q.rows[0] });
  } catch (err) {
    console.error("❌ Erreur PUT settings:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Activer/Désactiver 2FA
router.patch("/twofa", verifyToken, isAdmin, async (req, res) => {
  try {
    const q = await db.query(
      `UPDATE admin_settings
       SET twofa_enabled = NOT twofa_enabled, updated_at = NOW()
       WHERE admin_id = $1
       RETURNING twofa_enabled`,
      [req.user.id]
    );

    res.json({ message: "2FA mis à jour", enabled: q.rows[0].twofa_enabled });
  } catch (err) {
    console.error("❌ Erreur PATCH /twofa:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
