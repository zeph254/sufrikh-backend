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
        zabihah_only: zabihah_only ?? true,
        no_alcohol: no_alcohol ?? true,
        prayer_in_room: prayer_in_room ?? false,
        is_verified: false // Default to false for OTP verification
      }
    });

    // Generate token with shorter expiration for OTP flow
    const token = generateToken(user.id, '1h');
    
    // Return user data but don't automatically log them in
    res.status(201).json({ 
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_verified: false, // Explicitly set to false
        phone: user.phone || '',
        gender: user.gender || 'male'
      },
      requiresVerification: true // Flag to indicate OTP is needed
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle duplicate email error specifically
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Email already in use',
        details: 'This email address is already registered'
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
        password: true,
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
        special_requests: true,
        is_verified: true // Make sure to include this
      }
    });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user.id);
    
    // Always require verification if user isn't verified
    res.json({ 
      success: true,
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
        special_requests: user.special_requests || '',
        is_verified: user.is_verified || false // Ensure this is included
      },
      requiresVerification: !user.is_verified,
      redirectTo: !user.is_verified ? '/verify-otp' : null
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ error: 'User ID and OTP are required' });
    }

    // Verify OTP using your OTP service
    const isValid = await otpService.verifyOTP(userId, otp, 'email');
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { id: userId },
      data: { is_verified: true },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_verified: true
      }
    });

    // Generate new token with normal expiration
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user,
      message: 'Account verified successfully'
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ 
      error: 'OTP verification failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const requestOTP = async (req, res) => {
  try {
    const { userId, type = 'email' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, carrier: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send OTP based on type
    let otp;
    if (type === 'sms') {
      if (!user.phone || !user.carrier) {
        return res.status(400).json({ 
          error: 'Phone number and carrier not registered' 
        });
      }
      otp = await otpService.sendSmsOTP(user.phone, userId, user.carrier);
    } else {
      otp = await otpService.sendEmailOTP(user.email, userId);
    }

    res.json({ 
      success: true,
      message: `OTP sent via ${type}`,
      // In production, don't send the OTP back
      otp: process.env.NODE_ENV === 'development' ? otp : undefined 
    });

  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
  requestOTP,
  verifyOTP,
  updatePassword,
  verifyEmail
};