const express = require('express');
const router = express.Router();
const db = require('../db'); // Assure-toi que ce module connecte bien à PostgreSQL
const verifyToken = require('../middleware/auth');

// 🔸 GET /sales - Liste des ventes
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
  SELECT s.*, p.name AS product_name
  FROM sales s
  JOIN products p ON s.product_id = p.id
  ORDER BY s.created_at DESC
`);

    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des ventes :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🔸 POST /sales - Enregistrer une vente
router.post('/', async (req, res) => {
  const { product_id, quantity, payment_method } = req.body;

  try {
    // 1. Vérifier que le produit existe
    const result = await db.query('SELECT price, stock FROM products WHERE id = $1', [product_id]);
    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Stock insuffisant' });
    }

    const total = product.price * quantity;

    // 2. Enregistrer la vente
    await db.query(
      'INSERT INTO sales (product_id, quantity, total, payment_method) VALUES ($1, $2, $3, $4)',
      [product_id, quantity, total, payment_method]
    );

    // 3. Mettre à jour le stock
    await db.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2',
      [quantity, product_id]
    );

    res.status(201).json({ message: 'Vente enregistrée avec succès' });
  } catch (err) {
    console.error('Erreur enregistrement vente :', err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de la vente' });
  }
});
// Modifier une vente
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { total, paiement } = req.body;
    
    // Ici : mise à jour dans ta base (exemple fictif)
    res.json({ message: `Vente ${id} modifiée`, total, paiement });
});

// Annuler une vente
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    
    // Ici : suppression dans ta base (exemple fictif)
    res.json({ message: `Vente ${id} annulée` });
});

module.exports = router;
