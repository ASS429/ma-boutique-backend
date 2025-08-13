const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Exemple stockage en mémoire (à remplacer par ta base de données)
let utilisateurs = [];

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Champs manquants' });

    const existe = utilisateurs.find(u => u.email === email);
    if (existe) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    utilisateurs.push({ email, password: hashedPassword });

    res.json({ message: 'Utilisateur créé' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = utilisateurs.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Utilisateur introuvable' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
});

module.exports = router;
