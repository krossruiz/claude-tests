const mongoose = require('mongoose');

const requestItemSchema = new mongoose.Schema({
  amazonUrl: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  trackingUrl: {
    type: String,
    trim: true,
    default: null
  },
  orderStatus: {
    type: String,
    enum: ['not_ordered', 'ordered', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'not_ordered'
  },
  deliveryEstimate: {
    type: Date,
    default: null
  },
  extractedInfo: {
    itemName: { type: String, default: null },
    price: { type: String, default: null },
    carrier: { type: String, default: null },
    lastChecked: { type: Date, default: null },
    rawSummary: { type: String, default: null }
  }
});

const requestSchema = new mongoose.Schema({
  clubName: {
    type: String,
    required: true,
    trim: true
  },
  personName: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    required: true,
    enum: ['urgent', 'not-urgent']
  },
  desiredDeliveryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  items: {
    type: [requestItemSchema],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: 'At least one item is required.'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
