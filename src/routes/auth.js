const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const {Encryption} = require('../services/Encryption');
const { registerSchema, loginSchema } = require('../services/validators');
const router = express.Router();

const SECRETKEY = process.env.SECRETKEY || 'devil';

router.post('/register', async (req, res) => {
    const { username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv } = req.body;
    const EncData = Encryption(cardHolderName, cardNumber,cvv);
    const data = { username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv };
    const { error } = registerSchema.validate({ username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv });
    if (error) return res.status(400).json({ error: error.details[0].message, data : data});

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const stmt = db.prepare(`
            INSERT INTO users (username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(username , email , hashedPassword, planType, EncData.NewHolder,EncData.NewNumber, expiryDate,EncData.NewCvv);
        res.status(201).json({ message: 'User registered successfully', getData : username });
    } catch (err) {
        res.status(400).json({ error: err });
    }
});

router.get('/admin', async (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT id, username, email, planType, admin FROM users
        `);
        const users = stmt.all();

        res.status(200).json({ message: 'Users fetched successfully', users });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { error } = loginSchema.validate({ email, password });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = user.admin;
    const username = user.username;
    const plan = user.planType
    const token = jwt.sign({ id: user.id, username: user.username }, SECRETKEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, admin, username, plan});
});

router.post('/admin/register', async (req, res) => {
    const { username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv, admin } = req.body;

    const { error } = registerSchema.validate({ username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const stmt = db.prepare(`
            INSERT INTO users (username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv, admin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(username, email, hashedPassword, planType, cardHolderName, cardNumber, expiryDate, cvv, admin);
        res.status(201).json({ message: 'Admin user created successfully', username });
    } catch (err) {
        res.status(400).json({ error: err });
    }
});


module.exports = router;

