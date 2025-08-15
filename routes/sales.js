const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET : Liste ventes utilisateur
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, p.name AS product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des ventes :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST : Enregistrer une vente
router.post('/', verifyToken, async (req, res) => {
  const { product_id, quantity, payment_method } = req.body;

  try {
    // Vérifier que le produit appartient à l’utilisateur
    const result = await db.query(
      'SELECT price, stock FROM products WHERE id = $1 AND user_id = $2',
      [product_id, req.user.id]
    );
    const product = result.rows[0];
    if (!product) return res.status(404).json({ error: 'Produit introuvable ou non autorisé' });

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Stock insuffisant' });
    }

    const total = product.price * quantity;

    // Enregistrer la vente
    await db.query(
      'INSERT INTO sales (product_id, quantity, total, payment_method, user_id) VALUES ($1, $2, $3, $4, $5)',
      [product_id, quantity, total, payment_method, req.user.id]
    );

    // Mettre à jour le stock
    await db.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2 AND user_id = $3',
      [quantity, product_id, req.user.id]
    );

    res.status(201).json({ message: 'Vente enregistrée avec succès' });
  } catch (err) {
    console.error('Erreur enregistrement vente :', err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de la vente' });
  }
});

// DELETE : Annuler une vente utilisateur
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM sales WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vente introuvable ou non autorisée' });
    }
    res.json({ message: 'Vente annulée' });
  } catch (err) {
    console.error('Erreur annulation vente :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
