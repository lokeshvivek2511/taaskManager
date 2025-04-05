import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Add text index for search functionality
taskSchema.index({ title: 'text', description: 'text' });

// Add compound index for pagination and filtering
taskSchema.index({ creator: 1, status: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
