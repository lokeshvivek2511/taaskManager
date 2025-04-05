import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    recentTasks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tasks', {
          params: { limit: 5 },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = response.data;

        setStats({
          totalTasks: data.totalTasks,
          pendingTasks: data.tasks.filter(task => task.status === 'Pending').length,
          completedTasks: data.tasks.filter(task => task.status === 'Completed').length,
          recentTasks: data.tasks
        });
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container dbcon">
      <Navigation />
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user.username}!</h1>
          <p>Here's your task management overview</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <h3>Total Tasks</h3>
            <p className="stat-number">{stats.totalTasks}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending Tasks</h3>
            <p className="stat-number">{stats.pendingTasks}</p>
          </div>
          <div className="stat-card completed">
            <h3>Completed Tasks</h3>
            <p className="stat-number">{stats.completedTasks}</p>
          </div>
        </div>

        <div className="recent-tasks-section">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <Link to="/tasks" className="view-all">View All</Link>
          </div>
          <div className="recent-tasks-grid">
            {stats.recentTasks.map(task => (
              <div key={task._id} className={`task-card ${task.status.toLowerCase().replace(' ', '-')}`}>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span className="task-status">{task.status}</span>
                  <span className="task-priority">{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <Link to="/tasks/new" className="action-button create">
            Create New Task
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" className="action-button manage">
              Manage Users
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;