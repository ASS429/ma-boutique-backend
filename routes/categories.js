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

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }

    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST /categories:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    // Vérifier si la catégorie existe
    const catCheck = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (catCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    // Vérifier s'il y a des produits liés à cette catégorie
    const prodCheck = await db.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
    if (parseInt(prodCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer : la catégorie contient encore des produits.' });
    }

    // Supprimer la catégorie
    await db.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (err) {
    console.error('Erreur DELETE /categories/:id:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



module.exports = router;
