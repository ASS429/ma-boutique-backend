// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /products : Liste tous les produits avec leur catégorie
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
  SELECT *
  FROM products
  ORDER BY id DESC
`);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET /products:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /products : Ajoute un produit
router.post('/', async (req, res) => {
  try {
    const { name, category_id, scent, price, stock } = req.body;

    const result = await db.query(
      `INSERT INTO products (name, category_id, scent, price, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, category_id, scent, price, stock]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST /products:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /products/:id : Supprime un produit
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    console.error('Erreur DELETE /products/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
