const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Save user to DB
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );
    
    // 3. Generate JWT
    const token = generateToken(rows[0].id);
    
    res.status(201).json({
      status: 'success',
      token,
      user: rows[0]
    });
    
  } catch (err) {
    if (err.code === '23505') { // Unique violation (email exists)
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find user
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 2. Verify password
    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 3. Generate JWT
    const token = generateToken(user.id);
    
    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout (client-side token deletion)
const logout = (req, res) => {
  res.status(200).json({ status: 'success' });
};

module.exports = { register, login, logout };