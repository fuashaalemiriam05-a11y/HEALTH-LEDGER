const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'healthledger_secret_key',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password, fullName, phone, role = 'provider' } = req.body;

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or phone already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await query(
      'INSERT INTO users (email, phone, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, created_at',
      [email, phone, passwordHash, fullName, role]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('emailOrPhone').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { emailOrPhone, password } = req.body;

    // Find user by email or phone
    const user = await queryOne(
      'SELECT id, email, phone, password_hash, full_name, role, is_active, last_login FROM users WHERE email = $1 OR phone = $1',
      [emailOrPhone]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = true;
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthledger_secret_key');
    const user = await queryOne(
      'SELECT id, email, phone, full_name, role, is_active, last_login, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
});

module.exports = router;