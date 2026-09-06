const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const { extractOrderInfo } = require('../services/orderTracker');

// PATCH confirm or reject a request
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "confirmed", "rejected", or "pending".' });
    }
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH add tracking URL to a specific item and extract info
router.patch('/requests/:id/items/:itemId/tracking', async (req, res) => {
  try {
    const { trackingUrl } = req.body;
    if (!trackingUrl || !trackingUrl.trim()) {
      return res.status(400).json({ error: 'Tracking URL is required.' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const item = request.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    item.trackingUrl = trackingUrl.trim();
    item.orderStatus = 'ordered';

    // Try to extract order info via Ollama
    try {
      const info = await extractOrderInfo(trackingUrl.trim());
      if (info) {
        item.extractedInfo = {
          ...item.extractedInfo,
          ...info,
          lastChecked: new Date()
        };
        if (info.deliveryEstimate) {
          item.deliveryEstimate = new Date(info.deliveryEstimate);
        }
        if (info.orderStatus) {
          item.orderStatus = info.orderStatus;
        }
      }
    } catch (extractErr) {
      console.error('Ollama extraction failed:', extractErr.message);
      // Continue without extracted info — tracking URL is still saved
    }

    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH manually update an item's order status
router.patch('/requests/:id/items/:itemId/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const valid = ['not_ordered', 'ordered', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!valid.includes(orderStatus)) {
      return res.status(400).json({ error: `Order status must be one of: ${valid.join(', ')}` });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const item = request.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    item.orderStatus = orderStatus;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST trigger re-extraction for a specific item
router.post('/requests/:id/items/:itemId/extract', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const item = request.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    if (!item.trackingUrl) {
      return res.status(400).json({ error: 'No tracking URL set for this item.' });
    }

    const info = await extractOrderInfo(item.trackingUrl);
    if (info) {
      item.extractedInfo = {
        ...item.extractedInfo,
        ...info,
        lastChecked: new Date()
      };
      if (info.deliveryEstimate) {
        item.deliveryEstimate = new Date(info.deliveryEstimate);
      }
      if (info.orderStatus) {
        item.orderStatus = info.orderStatus;
      }
    }

    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
