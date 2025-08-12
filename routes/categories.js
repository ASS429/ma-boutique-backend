const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des catégories:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
