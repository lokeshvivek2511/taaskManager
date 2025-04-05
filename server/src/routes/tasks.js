import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware
const validateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().optional(),
  body('status').isIn(['Pending', 'In Progress', 'Completed']).optional(),
  body('priority').isIn(['Low', 'Medium', 'High']).optional(),
  body('dueDate').isISO8601().optional().toDate(),
  body('tags').isArray().optional()
];

// Get tasks with pagination and search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Role-based task access
    if (req.user.role === 'user') {
      query.$or = [
        { creator: req.user.id },
        { assignedTo: req.user.id }
      ];
    } else if (req.user.role === 'manager') {
      const managedUsers = await User.find({ managedBy: req.user.id }).select('_id');
      const managedUserIds = managedUsers.map(user => user._id);
      query.$or = [
        { creator: req.user.id },
        { assignedTo: req.user.id },
        { creator: { $in: managedUserIds } },
        { assignedTo: { $in: managedUserIds } }
      ];
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username')
      .populate('assignedTo', 'username')
      .populate('assignedBy', 'username');

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', [authMiddleware, ...validateTask], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = new Task({
      ...req.body,
      creator: req.user.id,
      assignedBy: req.body.assignedTo ? req.user.id : null
    });

    // Check if user has permission to assign task
    if (req.body.assignedTo && req.user.role === 'manager') {
      const assignedUser = await User.findById(req.body.assignedTo);
      if (!assignedUser || assignedUser.managedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only assign tasks to users you manage' });
      }
    }

    await task.save();
    await task.populate(['creator', 'assignedTo', 'assignedBy']);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', [authMiddleware, ...validateTask], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permission to update task
    if (req.user.role === 'user' && task.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    if (req.user.role === 'manager') {
      const managedUsers = await User.find({ managedBy: req.user.id }).select('_id');
      const managedUserIds = managedUsers.map(user => user._id.toString());
      if (
        task.creator.toString() !== req.user.id &&
        !managedUserIds.includes(task.creator.toString())
      ) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
    }

    Object.assign(task, req.body);
    await task.save();
    await task.populate(['creator', 'assignedTo', 'assignedBy']);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permission to delete task
    if (req.user.role === 'user' && task.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    if (req.user.role === 'manager') {
      const managedUsers = await User.find({ managedBy: req.user.id }).select('_id');
      const managedUserIds = managedUsers.map(user => user._id.toString());
      if (
        task.creator.toString() !== req.user.id &&
        !managedUserIds.includes(task.creator.toString())
      ) {
        return res.status(403).json({ message: 'Not authorized to delete this task' });
      }
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;