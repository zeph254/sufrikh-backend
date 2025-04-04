const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const prisma = require('../prisma/client');

// Register
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      gender,
      idType,
      idNumber,
      halalPreferences = {},
      specialRequests
    } = req.body;

    // Validation checks
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
        fields: ['password', 'confirmPassword']
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least 6 characters including letters and numbers',
        fields: ['password']
      });
    }

    // Create user with Prisma
    const user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password: await bcrypt.hash(password, 10),
        gender,
        id_type: idType,
        id_number: idNumber,
        prayer_in_room: halalPreferences.prayerInRoom || false,
        no_alcohol: halalPreferences.noAlcohol !== false,
        zabihah_only: halalPreferences.zabihahOnly !== false,
        special_requests: specialRequests
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
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

    // Generate JWT
    const token = generateToken(user.id);

    // Transform field names to camelCase for frontend
    const userResponse = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      idType: user.id_type,
      idNumber: user.id_number,
      prayerInRoom: user.prayer_in_room,
      noAlcohol: user.no_alcohol,
      zabihahOnly: user.zabihah_only,
      specialRequests: user.special_requests
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse
    });

  } catch (err) {
    if (err.code === 'P2002') { // Prisma unique constraint violation
      return res.status(400).json({ 
        success: false,
        error: 'Email already in use',
        fields: ['email']
      });
    }
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: err.message
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        fields: ['email', 'password']
      });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        fields: ['email', 'password']
      });
    }
    
    // Generate JWT
    const token = generateToken(user.id);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender
      }
    });
    
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Server error during login',
      message: err.message
    });
  }
};

// Logout remains the same
const logout = (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Logout successful'
  });
};

module.exports = { register, login, logout };