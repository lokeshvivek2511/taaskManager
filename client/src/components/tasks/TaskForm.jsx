import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../layout/Navigation';
import axios from 'axios';
import './Tasks.css';

const TaskForm = () => {
  const { token, isManager, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    dueDate: '',
    assignedTo: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isManager && !isAdmin) {
        return;
      }

      try {
        const response = await axios.get('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        let data = response.data;
        if (isManager) {
          data = data.filter(u => u.role === 'user'); // Managers can assign to users only
        } else if (isAdmin) {
          data = data.filter(u => u.role === 'user' || u.role === 'manager'); // Admins can assign to both
        }

        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      }
    };

    if (id) {
      fetchTask();
    }
    fetchUsers();
  }, [id, token]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const task = response.data;
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo?._id || ''
      });
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const taskData = {
        ...formData,
        assignedTo: (isManager || isAdmin) ? (formData.assignedTo || null) : user._id
      };
      if (id) {
        await axios.put(`/api/tasks/${id}`, taskData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        await axios.post('/api/tasks', taskData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="task-form-container">
      <Navigation />
      <h2>{id ? 'Edit Task' : 'Create New Task'}</h2>
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          {(isManager || isAdmin) && (
            <div className="form-group assignment-section">
              <label htmlFor="assignedTo">Assign To</label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="user-assignment-select"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/tasks')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {id ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;