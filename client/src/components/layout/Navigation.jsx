import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Layout.css";

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth(); // Pull the logged-in user and logout function from context
  const navigate = useNavigate();

  const role = user?.role || "user"; // default fallback

  const navLinks = {
    admin: [
      { to: "/", label: "📊 Dashboard" },
      { to: "/tasks", label: "📝 Tasks" },
      { to: "/admin", label: "👥 User Management" },
    ],
    manager: [
      { to: "/", label: "📊 Dashboard" },
      { to: "/tasks", label: "📝 Tasks" },
    ],
    user: [
      { to: "/", label: "📊 Dashboard" },
      { to: "/tasks", label: "📝 Tasks" },
    ],
  };

  const linksToShow = navLinks[role] || [];

  return (
    <>
      <button className="toggle-btn" onClick={() => setOpen(!open)}>
        {open ? "X" : "☰"}
      </button>
      <div className={open ? "sidebar open" :" hidden"}>
        <h2 className="sidebar-title">{role}</h2>
        <nav className="nav-links">
          {linksToShow.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate('/login');
              setOpen(false);
            }}
          >
            🚪 Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default Navigation;
