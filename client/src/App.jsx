import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/auth/PrivateRoute'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/dashboard/Dashboard'
import TaskList from './components/tasks/TaskList'
import TaskForm from './components/tasks/TaskForm'
import UserManagement from './components/admin/UserManagement'
// import './App.css'

const App = () => {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute>
              <TaskList />
            </PrivateRoute>
          } />
          <Route path="/tasks/new" element={
            <PrivateRoute>
              <TaskForm />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute adminOnly>
              <UserManagement />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App