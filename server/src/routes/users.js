import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Middleware to check if user is manager or admin
const isManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Manager or Admin only.' });
  }
  next();
};

// Validation middleware
const validateUser = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['user', 'manager']).withMessage('Invalid role')
];

// Get all users (Admin only)
router.get('/', [authMiddleware, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get managed users (Manager only)
router.get('/managed', [authMiddleware, isManagerOrAdmin], async (req, res) => {
  try {
    const users = await User.find({ managedBy: req.user.id }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching managed users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manager (Admin only)
router.post('/manager', [authMiddleware, isAdmin, ...validateUser], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create new manager
    const manager = new User({
      username,
      email,
      password,
      role: 'manager'
    });

    await manager.save();
    res.status(201).json({ message: 'Manager created successfully' });
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user under manager
router.post('/user', [authMiddleware, isManagerOrAdmin, ...validateUser], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: 'user',
      managedBy: req.user.id
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', [authMiddleware, isAdmin], async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;