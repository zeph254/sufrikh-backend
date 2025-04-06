const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');

const app = express();



// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true
  }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/auth', authRoutes);
// Add this to your existing routes
app.use('/api/users', require('./routes/userRoutes'));
// Add these lines to your existing app.js
app.use('/api', require('./routes/adminRoutes'));
app.use('/api/workers', require('./routes/workerRoutes'));


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Sufrikh Backend is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;