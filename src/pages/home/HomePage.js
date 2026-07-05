import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import './HomePage.css';
import { obtenerDatosUsuario } from '../../services/Usuarios_Api.js';
import { obtenerDatosInicio } from '../../services/Home_Api.js';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const staticEventsData = [
  {
    id: 1,
    date: new Date(2026, 6, 15),
    title: 'Entrega TFG',
    color: '#B574FF',
  },
  {
    id: 2,
    date: new Date(2026, 6, 20),
    title: 'Reunió de projecte',
    color: '#7AFF86',
  },
];

const getRolFriendlyName = (rol) => {
  if (rol === 'Estudiante') return 'Estudiant';
  if (rol === 'Profesor') return 'Profesor';
  return '';
};

const HomePage = () => {
  const [rol, setRol] = useState(null);
  const [userData, setUserData] = useState({
    nombre: '',
    gitUsername: null,
  });

  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const userRol = localStorage.getItem('rol');
    setRol(userRol);

    obtenerDatosUsuario()
      .then((data) => setUserData(data))
      .catch((error) =>
        console.error('Error al obtener datos del usuario:', error),
      );

    obtenerDatosInicio()
      .then((data) => setDashboardData(data))
      .catch((error) =>
        console.error('Error al obtener datos del dashboard:', error),
      );
  }, []);

  const handleNavigateToProfile = () => (window.location.href = '/perfil');
  const handleNavigateToCourses = () => (window.location.href = '/cursos');
  const handleNavigateToProjects = () => (window.location.href = '/equipos');

  if (!rol || !userData.nombre || !dashboardData) {
    return <p>Càrregant...</p>;
  }

  // 3. Función para añadir el punto en los días con evento
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const currentEvent = staticEventsData.find(
        (event) =>
          event.date.getDate() === date.getDate() &&
          event.date.getMonth() === date.getMonth() &&
          event.date.getFullYear() === date.getFullYear(),
      );

      // Si encuentra un evento, devuelve un div con el color correspondiente
      if (currentEvent) {
        return (
          <div
            className="event-dot"
            style={{ backgroundColor: currentEvent.color }}
          ></div>
        );
      }
    }
    return null;
  };

  return (
    <div className="home-page dashboard">
      <Sidebar />
      <div className="content">
        <div className="dashboard-row top-row">
          <div className="dashboard-section welcome-section">
            <div className="welcome-content-wrapper">
              <div className="welcome-text">
                <h1>
                  Benvingut/da,{' '}
                  <span className="user-name">
                    {userData.nombre} ({getRolFriendlyName(rol)})
                  </span>
                </h1>
                {rol === 'Estudiante' && (
                  <h2>
                    Aquesta és la pàgina principal després d&apos;iniciar
                    sessió. Pots accedir al teu perfil per configurar el teu
                    compte de Github o explorar els teus equips.
                  </h2>
                )}
                {rol === 'Profesor' && (
                  <h2>
                    Aquesta és la pàgina principal després d&apos;iniciar
                    sessió. Pots gestionar els teus cursos, els seus estudiants,
                    o accedir al teu perfil per configurar el teu compte de
                    Github.
                  </h2>
                )}
                {userData.gitUsername === null && (
                  <div className="config-reminders">
                    <p className="reminder-text">
                      ⚠️ Encara no has configurat el teu compte de{' '}
                      <strong>GitHub</strong>. Ves a la pàgina de Perfil per fer
                      la configuració.
                    </p>
                  </div>
                )}
                <div className="button-container">
                  <button
                    className="navigate-button"
                    onClick={handleNavigateToProfile}
                  >
                    Accedir al Perfil
                  </button>
                  {rol === 'Estudiante' ? (
                    <button
                      className="navigate-button"
                      onClick={handleNavigateToProjects}
                    >
                      Veure Equips
                    </button>
                  ) : (
                    <button
                      className="navigate-button"
                      onClick={handleNavigateToCourses}
                    >
                      Veure Cursos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARTAS KPI (Ahora usan dashboardData.kpis) */}
          <div className="dashboard-section kpi-section">
            <div className="kpi-card-container">
              <div className="kpi-card yellow">
                <p className="kpi-title">Total Cursos</p>
                <p className="kpi-value">{dashboardData.totalCursos || 0}</p>
              </div>
              <div className="kpi-card blue">
                <p className="kpi-title">Cursos Actius</p>
                <p className="kpi-value">
                  {dashboardData.totalCursosActivos || 0}
                </p>
              </div>
              <div className="kpi-card purple">
                <p className="kpi-title">Estudiants Assignats</p>
                <p className="kpi-value">
                  {dashboardData.totalEstudiantesAsignados || 0}
                </p>
              </div>
              <div className="kpi-card green">
                <p className="kpi-title">Equips Formats</p>
                <p className="kpi-value">
                  {dashboardData.totalEquiposFormados || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-row bottom-row">
          {/* SECCIÓN "RESUM CURSOS"*/}
          <div className="dashboard-section veus-cursos-section">
            <h2>Resum Cursos</h2>
            <div className="veus-cursos-card-container">
              {dashboardData.cursosRecientes?.length > 0 ? (
                dashboardData.cursosRecientes.map((course) => (
                  <div key={course.id} className="veus-cursos-card">
                    <div className="course-content-wrapper">
                      <p className="course-title">{course.nombreAsignatura}</p>
                      <div className="course-badges-wrapper">
                        <span className="badge badge-students">
                          Estudiants: {course.numeroEstudiantes || 0}
                        </span>
                        <span className="badge badge-teams">
                          Equips: {course.numeroEquipos || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Encara no hi ha cursos disponibles.</p>
              )}
            </div>
          </div>

          {/* SECCIÓN "ESDEVENIMENTS PROPERS" */}
          <div className="dashboard-section events-section">
            <h2>Esdeveniments Propers</h2>
            <div className="calendar-container">
              <Calendar tileContent={tileContent} locale="ca-ES" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
