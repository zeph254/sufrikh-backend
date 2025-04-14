const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const prisma = require('../prisma/client');

// Register - with enhanced debugging
const register = async (req, res) => {
  console.log('Register function called');
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      gender,
      id_type,
      id_number,
      special_requests,
      zabihah_only,
      no_alcohol,
      prayer_in_room
    } = req.body;

    // Basic validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER',
        phone,
        gender,
        id_type,
        id_number,
        special_requests,
        // Handle booleans carefully: default to schema values if undefined
        zabihah_only: zabihah_only ?? true,
        no_alcohol: no_alcohol ?? true,
        prayer_in_room: prayer_in_room ?? false
      }
    });

    const token = generateToken(user.id);
    res.status(201).json({ token, user });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};



// Login
// In your authController.js

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,  // Required for verification
        first_name: true,
        last_name: true,
        role: true,
        profile_picture: true,
        phone: true,
        gender: true,
        id_type: true,
        id_number: true,
        prayer_in_room: true,
        no_alcohol: true,
        zabihah_only: true,
        special_requests: true
      }
    });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user.id);
    
    // Return complete user data with defaults for missing fields
    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_picture: user.profile_picture || null,
        phone: user.phone || '',
        gender: user.gender || 'male',
        id_type: user.id_type || 'passport',
        id_number: user.id_number || '',
        prayer_in_room: user.prayer_in_room || false,
        no_alcohol: user.no_alcohol ?? true,
        zabihah_only: user.zabihah_only ?? true,
        special_requests: user.special_requests || ''
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};
// Logout
const logout = (req, res) => {
  res.json({ message: 'Logged out' });
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true }
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid password' });
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: await bcrypt.hash(newPassword, 12) }
    });
    
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { is_verified: true }
    });
    res.json({ message: 'Email verified' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Explicit exports
module.exports = {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  verifyEmail
};