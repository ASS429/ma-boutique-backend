const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// ==========================
//   Inscription (Admin ou public)
// ==========================
router.post("/register", async (req, res) => {
  const {
    username,
    password,
    company_name,
    role = "user",
    status = "Actif",
    plan = "Free",
    payment_status = "À jour",
    payment_method,
    expiration,
    amount = 0.00
  } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Champs manquants",
      details: "Le champ 'username' ou 'password' est vide."
    });
  }

  try {
    // Vérifie si l'utilisateur existe déjà
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

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion avec TOUS les champs
    const result = await pool.query(
      `INSERT INTO users 
        (username, password, company_name, role, status, plan, payment_status, payment_method, expiration, amount) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) 
       RETURNING id, username, company_name, role, status, plan, payment_status, payment_method, expiration, amount`,
      [
        username,
        hashedPassword,
        company_name || null,
        role,
        status,
        plan,
        payment_status,
        payment_method || null,
        expiration || null,
        amount
      ]
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
        const result = await pool.query(
            "SELECT id, username, password, role, company_name FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur introuvable" });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Mot de passe incorrect" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.username,
                role: user.role,
                company_name: user.company_name
            }
        });

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
//   Middleware Admin
// ==========================
function isAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    next();
}

// ==========================
//   Liste des utilisateurs
// ==========================
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        username, 
        company_name, 
        role, 
        status, 
        plan, 
        payment_status, 
        payment_method, 
        expiration, 
        amount
      FROM users
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
//   Gestion des utilisateurs (Admin)
// ==========================

// Bloquer un utilisateur
router.put("/users/:id/block", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE users SET status = 'Bloqué' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Réactiver un utilisateur
router.put("/users/:id/activate", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE users SET status = 'Actif', payment_status = 'À jour' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un utilisateur
router.delete("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ message: "Utilisateur supprimé", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer un rappel (simple log pour l’instant)
router.post("/users/:id/reminder", authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await pool.query("SELECT username FROM users WHERE id = $1", [req.params.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });

    // ⚡ Pour l'instant, juste un log. On branchera un vrai email après.
    console.log(`📩 Rappel envoyé à ${user.rows[0].username}`);

    res.json({ message: `Rappel envoyé à ${user.rows[0].username}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
//   Infos utilisateur connecté
// ==========================
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, company_name, role, status, plan, payment_status, payment_method, expiration, amount FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erreur lors de /auth/me :", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;


