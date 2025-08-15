const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /paiements : liste des paiements
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, date, montant AS amount
      FROM paiements
      ORDER BY date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET /paiements:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
