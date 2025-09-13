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

/**
 * GET /admin-stats/transactions?limit=10
 * Retourne la liste des abonnements validés ou en attente (classés par date desc)
 */
router.get("/transactions", verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const q = await db.query(
      `SELECT id, username, plan, amount, payment_method, upgrade_status, expiration
       FROM users
       WHERE plan = 'Premium'
       ORDER BY expiration DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );

    res.json(q.rows);
  } catch (err) {
    console.error("❌ Erreur /admin-stats/transactions:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Comptes Admin
router.get("/accounts", verifyToken, isAdmin, async (req, res) => {
  try {
    // Soldes par méthode de paiement (Wave, Orange, Cash)
    const accountsQ = await db.query(
      `SELECT payment_method, COALESCE(SUM(amount),0) AS total
       FROM users
       WHERE plan = 'Premium' AND upgrade_status = 'validé'
       GROUP BY payment_method`
    );

    // Total disponible
    const totalQ = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total
       FROM users
       WHERE plan = 'Premium' AND upgrade_status = 'validé'`
    );

    // Entrées aujourd’hui
    const entriesQ = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total
       FROM users
       WHERE plan = 'Premium' 
       AND upgrade_status = 'validé'
       AND DATE(expiration) = CURRENT_DATE`
    );

    // Sorties aujourd’hui (retraits validés)
    const withdrawalsQ = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total
       FROM withdrawals
       WHERE status = 'validé'
       AND DATE(created_at) = CURRENT_DATE`
    );

    const accounts = accountsQ.rows.reduce((acc, row) => {
      acc[row.payment_method] = Number(row.total);
      return acc;
    }, {});

    const total = Number(totalQ.rows[0].total);
    const entries = Number(entriesQ.rows[0].total);
    const withdrawals = Number(withdrawalsQ.rows[0].total);
    const net = entries - withdrawals;

    res.json({
      accounts, // { wave: 32000, orange: 45000, cash: 15000 }
      total,
      entries,
      withdrawals,
      net
    });
  } catch (err) {
    console.error("❌ Erreur /admin-stats/accounts:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



module.exports = router;
