const express = require('express');
const router = express.Router();
const db = require('../db'); // ton fichier de connexion à la DB

// 1. Ventes par catégorie
router.get('/ventes-par-categorie', async (req, res) => {
  const { rows } = await db.query(`
    SELECT c.name AS categorie, SUM(s.quantity) AS total_quantite, SUM(s.quantity * p.price) AS total_montant
    FROM sales s
    JOIN products p ON s.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    ORDER BY total_quantite DESC
  `);
  res.json(rows);
});

// 2. Ventes par jour
router.get('/ventes-par-jour', async (req, res) => {
  const { rows } = await db.query(`
    SELECT DATE(s.created_at) AS date, SUM(s.quantity * p.price) AS total_montant
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY DATE(s.created_at)
    ORDER BY date ASC
  `);
  res.json(rows);
});

// 3. Répartition paiements
router.get('/paiements', async (req, res) => {
  const { rows } = await db.query(`
    SELECT s.payment_method, COUNT(*) AS total_ventes, SUM(s.quantity * p.price) AS total_montant
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY s.payment_method
  `);
  res.json(rows);
});

// 4. Top produits
router.get('/top-produits', async (req, res) => {
  const { rows } = await db.query(`
    SELECT p.name AS produit, SUM(s.quantity) AS total_quantite, SUM(s.quantity * p.price) AS total_montant
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.name
    ORDER BY total_quantite DESC
    LIMIT 10
  `);
  res.json(rows);
});

// 5. Stock faible
router.get('/stock-faible', async (req, res) => {
  const seuil = parseInt(req.query.seuil) || 5;
  const { rows } = await db.query(`
    SELECT p.name AS produit, p.stock
    FROM products p
    WHERE p.stock <= $1
    ORDER BY p.stock ASC
  `, [seuil]);
  res.json(rows);
});

module.exports = router;
