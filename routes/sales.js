const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET : Liste ventes utilisateur
router.get('/', verifyToken, async (req, res) => {
  console.log("👤 Utilisateur authentifié:", req.user);
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
// PATCH : Modifier une vente (ex: quantité ou mode de paiement)
router.patch('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { quantity, payment_method } = req.body;

  try {
    // Vérifier que la vente existe et appartient à l’utilisateur
    const venteResult = await db.query(
      'SELECT * FROM sales WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (venteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Vente introuvable ou non autorisée' });
    }
    const vente = venteResult.rows[0];

    // Si quantité changée → recalculer total + ajuster stock
    if (quantity && quantity !== vente.quantity) {
      // Récupérer le produit lié
      const productResult = await db.query(
        'SELECT price, stock FROM products WHERE id = $1 AND user_id = $2',
        [vente.product_id, req.user.id]
      );
      const product = productResult.rows[0];
      if (!product) {
        return res.status(404).json({ error: 'Produit introuvable' });
      }

      const diff = quantity - vente.quantity; // différence de quantité
      if (product.stock < diff) {
        return res.status(400).json({ error: 'Stock insuffisant pour augmenter la quantité' });
      }

      // Mettre à jour la vente
      await db.query(
        'UPDATE sales SET quantity = $1, total = $2, payment_method = COALESCE($3, payment_method) WHERE id = $4 AND user_id = $5',
        [quantity, product.price * quantity, payment_method, id, req.user.id]
      );

      // Ajuster le stock
      await db.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2 AND user_id = $3',
        [diff, vente.product_id, req.user.id]
      );
    } else if (payment_method) {
      // Mise à jour uniquement du mode de paiement
      await db.query(
        'UPDATE sales SET payment_method = $1 WHERE id = $2 AND user_id = $3',
        [payment_method, id, req.user.id]
      );
    }

    const updated = await db.query(
      'SELECT * FROM sales WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json(updated.rows[0]);

  } catch (err) {
    console.error('Erreur PATCH /sales/:id:', err);
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
