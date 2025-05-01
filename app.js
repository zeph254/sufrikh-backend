// app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // Changed from '/api'
app.use('/api/password', require('./routes/passwordRoutes'));
// Add this to your app.js
app.use('/api/otp', require('./routes/otpRoutes'));

// Error handling middleware
app.use(errorHandler);

// Remove this duplicate route
// app.use('/api/workers', require('./routes/workerRoutes')); // Remove this line

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Sufrikh Backend is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;