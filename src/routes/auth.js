const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { registerSchema, loginSchema } = require('../services/validators');
const router = express.Router();

const SECRETKEY = process.env.SECRETKEY || 'devil';

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const { error } = registerSchema.validate({ username, email, password });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const stmt = db.prepare(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`);
        stmt.run(username, email, hashedPassword);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'User already exists' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { error } = loginSchema.validate({ email, password });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRETKEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
});

module.exports = router;
