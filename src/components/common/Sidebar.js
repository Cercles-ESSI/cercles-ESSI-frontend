import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaBars,
  FaHome,
  FaUser,
  FaProjectDiagram,
  FaBook,
} from 'react-icons/fa';
import './Sidebar.css';
import Logout from '../../components/auth/Logout';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const rol = localStorage.getItem('rol');

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="toggle-button" onClick={toggleSidebar}>
        <FaBars />
      </div>
      <div className="menu-items">
        <NavLink to="/home">
          <FaHome />
          <span className="link-text">Inici</span>
        </NavLink>
        <NavLink to="/perfil">
          <FaUser />
          <span className="link-text">Perfil</span>
        </NavLink>
        {rol === 'Estudiante' && (
          <NavLink to="/equipos">
            <FaProjectDiagram />
            <span className="link-text">Equips</span>
          </NavLink>
        )}
        {rol === 'Profesor' && (
          <NavLink to="/cursos">
            <FaBook />
            <span className="link-text">Cursos</span>
          </NavLink>
        )}
      </div>
      <div className={`logout-container ${isOpen ? '' : 'closed'}`}>
        <Logout isSidebarOpen={isOpen} />
      </div>
    </div>
  );
};

export default Sidebar;
