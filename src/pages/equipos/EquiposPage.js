import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { getEquiposDeUsuario } from '../../services/Equipos_Api';
import './EquiposPage.css';

const COLORS = [
  '#6C9975',
  '#BB6365',
  '#785B75',
  '#5E807F',
  '#BA5A31',
  '#355c7d',
];
const ICONS = ['fa-users', 'fa-laptop', 'fa-tasks', 'fa-code', 'fa-book'];

const EquiposPage = () => {
  const navigate = useNavigate();
  const [equiposActivos, setEquiposActivos] = useState([]);
  const [equiposInactivos, setEquiposInactivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactiveTeams, setShowInactiveTeams] = useState(false);

  const id = localStorage.getItem('id');
  const token = localStorage.getItem('jwtToken');

  useEffect(() => {
    const fetchEquipos = async () => {
      if (!id) {
        setError('Usuario no autenticado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const equiposData = await getEquiposDeUsuario(id, token);

        // Separar equipos por el estado del curso
        const activos = equiposData.filter((equipo) => equipo.cursoActivo);
        const inactivos = equiposData.filter((equipo) => !equipo.cursoActivo);

        setEquiposActivos(activos);
        setEquiposInactivos(inactivos);
      } catch (error) {
        setError('No se pudieron cargar los equipos.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipos();
  }, [id, token]);

  const handleCardClick = (id) => {
    navigate(`/equipos/${id}`);
  };

  const handleCreateEquipoClick = () => {
    navigate('/equipos/crear');
  };

  if (loading) {
    return (
      <div className="equipos-page">
        <Sidebar />
        <div className="content loading-state">Carregant equips...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="equipos-page">
        <Sidebar />
        <div className="content error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="equipos-page">
      <Sidebar />
      <div className="content">
        {/* CABECERA */}
        <div className="page-header">
          <div className="header-titles">
            <h1>Els meus equips</h1>
            <p>Gestió i resum dels teus grups de treball actius i passats.</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={handleCreateEquipoClick}>
              + Crear un nou equip
            </button>
          </div>
        </div>

        {/* SECCIÓN EQUIPOS ACTIVOS */}
        <div className="modern-section">
          <h2 className="section-title">Equips de cursos actius</h2>

          {equiposActivos.length > 0 ? (
            <div className="equipos-grid">
              {equiposActivos.map((equipo, index) => (
                <div
                  key={equipo.id}
                  className="equipo-card-colored"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  onClick={() => handleCardClick(equipo.id)}
                >
                  <div className="card-top">
                    <div className="icon-container">
                      <i className={`fas ${ICONS[index % ICONS.length]}`} />
                    </div>
                  </div>
                  <div className="card-bottom">
                    <h3>{equipo.nombre}</h3>
                    <p>
                      <i className="fas fa-graduation-cap"></i>{' '}
                      {equipo.cursoNombre}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No tens cap equip actiu en aquest moment.
            </div>
          )}
        </div>

        {/* SECCIÓN EQUIPOS INACTIVOS */}
        <div className="modern-section mt-2">
          <button
            className="toggle-inactive-teams"
            onClick={() => setShowInactiveTeams(!showInactiveTeams)}
          >
            {showInactiveTeams
              ? 'Ocultar equips passats ▲'
              : 'Veure equips de cursos inactius ▼'}
          </button>

          {showInactiveTeams && (
            <div className="equipos-grid mt-1">
              {equiposInactivos.length > 0 ? (
                equiposInactivos.map((equipo, index) => (
                  <div
                    key={equipo.id}
                    className="equipo-card-colored inactive"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    onClick={() => handleCardClick(equipo.id)}
                  >
                    <div className="card-top">
                      <div className="icon-container">
                        <i className={`fas ${ICONS[index % ICONS.length]}`} />
                      </div>
                      <span className="inactive-badge">Inactiu</span>
                    </div>
                    <div className="card-bottom">
                      <h3>{equipo.nombre}</h3>
                      <p>
                        <i className="fas fa-graduation-cap"></i>{' '}
                        {equipo.cursoNombre}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No tens equips en cursos passats.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquiposPage;
