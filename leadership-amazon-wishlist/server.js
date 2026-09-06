require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const clubsRouter = require('./routes/clubs');
const requestsRouter = require('./routes/requests');
const adminRouter = require('./routes/admin');
const { startOrderTracking } = require('./services/orderTracker');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/clubs', clubsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/admin', adminRouter);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amazon-wishlist')
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    // Start background order tracking
    startOrderTracking();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
