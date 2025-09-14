const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/auth");

// ✅ Charger toutes les alertes actives avec le username de l’utilisateur
router.get("/", verifyToken, async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT a.id, a.type, a.message, a.days, a.seen, a.ignored, a.created_at,
              u.username
       FROM alerts a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.archived = false
       ORDER BY a.created_at DESC`
    );
    res.json(q.rows);
  } catch (err) {
    console.error("❌ Erreur GET /alerts:", err);
    res.status(500).json({ error: "Impossible de charger les alertes" });
  }
});


// ✅ Marquer une alerte comme vue
router.patch("/:id/seen", verifyToken, async (req, res) => {
  try {
    const q = await pool.query(
      `UPDATE alerts SET seen = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ error: "Alerte introuvable" });
    res.json({ message: "✅ Alerte marquée comme vue", alert: q.rows[0] });
  } catch (err) {
    console.error("❌ Erreur PATCH /alerts/:id/seen:", err);
    res.status(500).json({ error: "Impossible de mettre à jour l’alerte" });
  }
});

// ✅ Ignorer une alerte (gardée mais signalée ignorée)
router.patch("/:id/ignore", verifyToken, async (req, res) => {
  try {
    const q = await pool.query(
      `UPDATE alerts SET ignored = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ error: "Alerte introuvable" });
    res.json({ message: "✅ Alerte ignorée", alert: q.rows[0] });
  } catch (err) {
    console.error("❌ Erreur PATCH /alerts/:id/ignore:", err);
    res.status(500).json({ error: "Impossible d’ignorer l’alerte" });
  }
});

// ✅ Fermer une alerte (supprimer ou archiver)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const q = await pool.query(
      `UPDATE alerts SET archived = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ error: "Alerte introuvable" });
    res.json({ message: "✅ Alerte fermée", alert: q.rows[0] });
  } catch (err) {
    console.error("❌ Erreur DELETE /alerts/:id:", err);
    res.status(500).json({ error: "Impossible de fermer l’alerte" });
  }
});

module.exports = router;
