const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  console.log("👤 Utilisateur authentifié:", req.user);
  const result = await db.query('SELECT * FROM tontines ORDER BY created_date DESC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, type, amount, members } = req.body;
  const result = await db.query(
    `INSERT INTO tontines (name, type, amount, members)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, type, amount, members]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
