// routes/adminStats.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");

// Middleware local pour vérifier admin
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
}

/**
 * GET /admin-stats/revenus?period=all|daily|weekly|monthly
 * Retourne : balance (somme validée tous temps), periodTotal (somme validée pour période), pending (somme en attente)
 */
router.get("/revenus", verifyToken, isAdmin, async (req, res) => {
  try {
    const period = (req.query.period || "monthly").toLowerCase();

    // Construire filtre période sur la colonne expiration (utilisée pour les abonnements)
    let periodFilter = "";
    if (period === "daily") {
      periodFilter = "AND DATE(expiration) = CURRENT_DATE";
    } else if (period === "weekly") {
      periodFilter = "AND DATE_TRUNC('week', expiration) = DATE_TRUNC('week', CURRENT_DATE)";
    } else if (period === "monthly") {
      periodFilter = "AND DATE_TRUNC('month', expiration) = DATE_TRUNC('month', CURRENT_DATE)";
    } // 'all' => pas de filtre

    // Balance totale validée (tous temps)
    const balQ = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS balance
       FROM users
       WHERE plan = 'Premium' AND upgrade_status = 'validé'`
    );

    // Montant validé pour la période sélectionnée
    const periodQ = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS period_total
       FROM users
       WHERE plan = 'Premium' AND upgrade_status = 'validé' ${period === 'all' ? '' : periodFilter}`
    );

    // Montant en attente (demandes en attente)
    const pendingQ = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS pending
       FROM users
       WHERE plan = 'Premium' AND upgrade_status = 'en attente'`
    );

    const balance = Number(balQ.rows[0].balance || 0);
    const periodTotal = Number(periodQ.rows[0].period_total || 0);
    const pending = Number(pendingQ.rows[0].pending || 0);

    res.json({ balance, periodTotal, pending, period });
  } catch (err) {
    console.error("❌ Erreur /admin-stats/revenus:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
