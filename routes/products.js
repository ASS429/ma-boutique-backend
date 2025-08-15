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
    console.log('📩 POST /products reçu :', req.body); // ✅ Log complet

    const { name, category_id, scent, price, stock, price_achat } = req.body;

    const result = await db.query(
      `INSERT INTO products (name, category_id, scent, price, stock, price_achat)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        category_id,
        scent,
        Number.isFinite(+price) ? +price : 0,
        Number.isFinite(+stock) ? +stock : 0,
        Number.isFinite(+price_achat) ? +price_achat : 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST /products:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// PATCH /products/:id : Met à jour un ou plusieurs champs
router.patch('/:id', async (req, res) => {
  try {
    console.log('📩 PATCH /products reçu :', req.body); // ✅ Log complet

    const fields = ['name', 'category_id', 'scent', 'price', 'stock', 'price_achat'];
    const set = [];
    const values = [];
    let i = 1;

    for (const f of fields) {
      if (req.body.hasOwnProperty(f)) {
        if (['price', 'stock', 'price_achat', 'category_id'].includes(f)) {
          values.push(Number.isFinite(+req.body[f]) ? +req.body[f] : 0);
        } else {
          values.push(req.body[f]);
        }
        set.push(`${f} = $${i++}`);
      }
    }

    if (set.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
    }

    values.push(req.params.id);
    const result = await db.query(
      `UPDATE products SET ${set.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur PATCH /products/:id:', err);
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
