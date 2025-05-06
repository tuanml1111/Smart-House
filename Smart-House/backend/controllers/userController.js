const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Check if username already exists
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Create user
    const user = await UserModel.createUser({
      username,
      email,
      password
    });
    
    // Create token
    const token = jwt.sign(
      { id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] Login attempt received:`, {
    username: req.body.username,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      console.log(`[${timestamp}] Login failed: Missing username or password`);
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }
    
    // Check if user exists
    console.log(`[${timestamp}] Checking if user exists: ${username}`);
    const user = await UserModel.getUserByUsername(username);
    if (!user) {
      console.log(`[${timestamp}] Login failed: User not found - ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    console.log(`[${timestamp}] User found, checking password`);
    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      console.log(`[${timestamp}] Login failed: Password mismatch for ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Create token
    console.log(`[${timestamp}] Password verified, creating token`);
    const token = jwt.sign(
      { id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    console.log(`[${timestamp}] Login successful for ${username}`);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(`[${timestamp}] Login error:`, error.message);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await UserModel.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/auth/me
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    
    // Update user
    const user = await UserModel.updateUser(req.user.id, updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};