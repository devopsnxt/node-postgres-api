const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, message, created_at FROM contacts ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Request body must include name and email' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, message, created_at',
      [name, email, phone || null, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A contact with that email already exists' });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

module.exports = router;