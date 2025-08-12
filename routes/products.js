const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const result = await db.query(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
  `);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, category_id, scent, price, stock } = req.body;
  const result = await db.query(
    `INSERT INTO products (name, category_id, scent, price, stock)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, category_id, scent, price, stock]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ message: 'Produit supprimé' });
});

module.exports = router;
