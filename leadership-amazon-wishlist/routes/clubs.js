const express = require('express');
const router = express.Router();
const Club = require('../models/Club');

// GET all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new club
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Club name is required.' });
    }
    const existing = await Club.findOne({ name: name.trim() });
    if (existing) {
      return res.json(existing);
    }
    const club = await Club.create({ name: name.trim() });
    res.status(201).json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
