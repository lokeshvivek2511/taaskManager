import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, adminOnly, managerOnly }) => {
  const { isAuthenticated, isAdmin, isManager, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (managerOnly && !(isManager || isAdmin)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;