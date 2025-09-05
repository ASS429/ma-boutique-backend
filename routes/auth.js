const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// ==========================
//   Inscription
// ==========================
router.post("/register", async (req, res) => {
    const { username, password, company_name } = req.body; // <-- on accepte aussi company_name

    if (!username || !password) {
        return res.status(400).json({
            error: "Champs manquants",
            details: "Le champ 'username' ou 'password' est vide."
        });
    }

    try {
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: "Utilisateur déjà existant",
                details: `Le nom d'utilisateur '${username}' est déjà pris.`
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (username, password, company_name) VALUES ($1, $2, $3) RETURNING id, username, company_name",
            [username, hashedPassword, company_name || null]
        );

        res.status(201).json({
            message: "Compte créé avec succès",
            user: result.rows[0]
        });

    } catch (err) {
        console.error("❌ Erreur lors de l'inscription :", err);
        res.status(500).json({
            error: "Erreur serveur",
            details: err.message || err
        });
    }
});

// ==========================
//   Connexion
// ==========================
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Champs manquants" });
    }

    try {
        const user = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur introuvable" });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: "Mot de passe incorrect" });
        }

        const token = jwt.sign(
            { id: user.rows[0].id, username: user.rows[0].username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });

    } catch (err) {
        console.error("❌ Erreur lors de la connexion :", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================
//   Middleware Auth
// ==========================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ==========================
//   Endpoint /me
// ==========================
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, company_name FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération de l'utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================
//   Liste des utilisateurs
// ==========================
router.get("/users", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, company_name FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
