const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Club = require('../models/Club');

// GET all requests with optional filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { club, sort } = req.query;
    const filter = {};
    if (club) {
      filter.clubName = club;
    }

    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'delivery') {
      sortOption = { 'items.deliveryEstimate': 1, createdAt: -1 };
    }

    const requests = await Request.find(filter).sort(sortOption);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single request
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new request
router.post('/', async (req, res) => {
  try {
    const { clubName, personName, message, urgency, desiredDeliveryDate, items } = req.body;

    if (!clubName || !personName || !message || !urgency) {
      return res.status(400).json({ error: 'clubName, personName, message, and urgency are required.' });
    }
    if (!['urgent', 'not-urgent'].includes(urgency)) {
      return res.status(400).json({ error: 'Urgency must be "urgent" or "not-urgent".' });
    }
    if (urgency === 'urgent' && !desiredDeliveryDate) {
      return res.status(400).json({ error: 'Desired delivery date is required for urgent requests.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }
    for (const item of items) {
      if (!item.amazonUrl || !item.amazonUrl.trim()) {
        return res.status(400).json({ error: 'Each item must have an Amazon URL.' });
      }
      if (item.quantity != null && (item.quantity < 1 || !Number.isInteger(item.quantity))) {
        return res.status(400).json({ error: 'Quantity must be a positive integer.' });
      }
    }

    // Ensure club exists in the database
    const existingClub = await Club.findOne({ name: clubName.trim() });
    if (!existingClub) {
      await Club.create({ name: clubName.trim() });
    }

    const request = await Request.create({
      clubName: clubName.trim(),
      personName: personName.trim(),
      message: message.trim(),
      urgency,
      desiredDeliveryDate: desiredDeliveryDate || null,
      items: items.map(item => ({
        amazonUrl: item.amazonUrl.trim(),
        quantity: item.quantity || 1
      }))
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
