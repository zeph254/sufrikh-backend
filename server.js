require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

// Database connection and server start
const startServer = async () => {
  try {
    await db.connect();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();