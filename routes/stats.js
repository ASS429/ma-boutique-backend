const express = require('express');
const router = express.Router();
const db = require('../db'); // ton fichier de connexion à la base

// 1. Ventes par catégorie
router.get('/ventes-par-categorie', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.name AS categorie,
             SUM(s.quantity) AS total_quantite,
             SUM(s.quantity * p.price) AS total_montant
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY total_quantite DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. Ventes par jour (historique complet, avec CA et quantité)
router.get('/ventes-par-jour', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DATE(s.created_at) AS date,
             SUM(s.quantity) AS total_quantite,
             SUM(s.quantity * p.price) AS total_montant
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// 3. Répartition paiements
router.get('/paiements', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.payment_method,
             COUNT(*) AS total_ventes,
             SUM(s.quantity * p.price) AS total_montant
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY s.payment_method
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. Top produits
router.get('/top-produits', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.name AS produit,
             SUM(s.quantity) AS total_quantite,
             SUM(s.quantity * p.price) AS total_montant
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY p.name
      ORDER BY total_quantite DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. Stock faible
router.get('/stock-faible', async (req, res) => {
  try {
    const seuil = parseInt(req.query.seuil) || 5;
    const { rows } = await db.query(`
      SELECT p.name AS produit,
             p.stock
      FROM products p
      WHERE p.stock <= $1
      ORDER BY p.stock ASC
    `, [seuil]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
