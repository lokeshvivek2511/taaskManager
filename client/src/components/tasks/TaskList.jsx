import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../layout/Navigation';
import axios from 'axios';
import './Tasks.css';

const TaskList = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks', {
        params: {
          page: currentPage,
          search: searchTerm,
          status: statusFilter,
          assignment: assignmentFilter
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data;
      setTasks(data.tasks);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentPage, searchTerm, statusFilter, assignmentFilter, token]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAssignmentFilter = (e) => {
    setAssignmentFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="task-list-container">
      <Navigation />
      <div className="task-list-header">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="status-filter"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          value={assignmentFilter}
          onChange={handleAssignmentFilter}
          className="status-filter"
        >
          <option value="">All Tasks</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="no-tasks">No tasks found</div>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className={`task-card ${task.status.toLowerCase().replace(' ', '-')}`}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div className="task-meta">
                <span className="task-status">{task.status}</span>
                <span className="task-priority">{task.priority}</span>
                {task.dueDate && (
                  <span className="task-due-date">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className={`task-assignee ${!task.assignedTo ? 'unassigned' : ''}`}>
                <span>Assigned to: {task.assignedTo?.username || 'Unassigned'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>{currentPage} of {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;