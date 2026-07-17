import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import './CursosPage.css';
import { obtenerCursos } from '../../services/Cursos_Api.js';
import { crearProfesor } from '../../services/Usuarios_Api.js';

const CursosPage = () => {
  const navigate = useNavigate();
  const [cursosActivos, setCursosActivos] = useState([]);
  const [cursosInactivos, setCursosInactivos] = useState([]);
  const [showInactiveCourses, setShowInactiveCourses] = useState(false);
  const [showProfessorPopup, setShowProfessorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [professorData, setProfessorData] = useState({
    nombre: '',
    correo: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Obtener la lista de cursos del backend
    obtenerCursos()
      .then((data) => {
        // Dividir los cursos en activos e inactivos y ordenarlos
        const activos = data
          .filter((curso) => curso.activo)
          .sort((a, b) => compareCursos(a, b));
        const inactivos = data
          .filter((curso) => !curso.activo)
          .sort((a, b) => compareCursos(a, b));
        setCursosActivos(activos);
        setCursosInactivos(inactivos);
      })
      .catch((error) => {
        console.error('Error al obtener los cursos:', error);
      });
    console.log('datos: ', cursosActivos);
  }, []);

  const compareCursos = (a, b) => {
    if (a.añoInicio === b.añoInicio) {
      return a.cuatrimestre - b.cuatrimestre;
    }
    return b.añoInicio - a.añoInicio;
  };

  const handleRowClick = (id) => {
    navigate(`/cursos/${id}`);
  };

  const handleCreateNewCourse = () => {
    navigate('/cursos/crear');
  };

  const handleAddProfessor = async () => {
    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
      alert('Token no encontrado. Inicia sesión de nuevo.');
      return;
    }

    try {
      await crearProfesor(professorData, jwtToken);
      setShowProfessorPopup(false);
      setSuccessMessage(
        `El professor "${professorData.nombre}" amb correu "${professorData.correo}" s'ha afegit correctament a la BD.`,
      );
      setProfessorData({
        nombre: '',
        correo: '',
      });
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error al afegir el professor:', error);
      alert(`Error al afegir el professor: ${error.message}`);
    }
  };

  // Variable auxiliar para renderizar la tabla que toca según la pestaña activa
  const cursosMostrados = showInactiveCourses ? cursosInactivos : cursosActivos;

  return (
    <div className="cursos-page">
      <Sidebar />
      <div className="content">
        {/* NUEVA CABECERA */}
        <div className="page-header">
          <div className="header-titles">
            <h1>Els meus cursos</h1>
            <p>Gestió i resum de les teves assignatures.</p>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowProfessorPopup(true)}
            >
              Afegir professor
            </button>
            <button className="btn-primary" onClick={handleCreateNewCourse}>
              Crear un nou curs
            </button>
          </div>
        </div>

        {/* CONTENEDOR DE LA TABLA */}
        <div className="table-card">
          {/* PESTAÑAS*/}
          <div className="table-tabs">
            <button
              className={`tab ${!showInactiveCourses ? 'active' : ''}`}
              onClick={() => setShowInactiveCourses(false)}
            >
              Actius
            </button>
            <button
              className={`tab ${showInactiveCourses ? 'active' : ''}`}
              onClick={() => setShowInactiveCourses(true)}
            >
              Inactius
            </button>
          </div>

          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nom de l&apos;assignatura</th>
                  <th>Any / Quadrimestre</th>
                  <th>Estudiants</th>
                  <th>Equips</th>
                  <th>Sense equip</th>
                </tr>
              </thead>
              <tbody>
                {cursosMostrados.map((curso) => (
                  <tr
                    key={curso.id}
                    onClick={() => handleRowClick(curso.id)}
                    className="clicable-row"
                  >
                    <td className="fw-bold">{curso.nombreAsignatura}</td>
                    <td>
                      {curso.añoInicio} -{' '}
                      {curso.cuatrimestre === 1 ? 'Q1' : 'Q2'}
                    </td>
                    <td>
                      <span className="badge badge-students">
                        {curso.numeroEstudiantes}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-teams">
                        {curso.numeroEquipos}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          curso.numeroEstudiantesSinEquipo > 0
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {curso.numeroEstudiantesSinEquipo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mensaje de estado vacío si no hay cursos en esa pestaña */}
            {cursosMostrados.length === 0 && (
              <div className="empty-state">
                Encara no hi ha cursos en aquesta secció.
              </div>
            )}
          </div>
        </div>

        {/* POPUPS*/}
        {showProfessorPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <h2>Afegir professor a la BD</h2>
              <div className="form-group">
                <label>Nom i cognoms:</label>
                <input
                  type="text"
                  value={professorData.nombre}
                  onChange={(e) =>
                    setProfessorData({
                      ...professorData,
                      nombre: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Correu electrònic:</label>
                <input
                  type="email"
                  value={professorData.correo}
                  onChange={(e) =>
                    setProfessorData({
                      ...professorData,
                      correo: e.target.value,
                    })
                  }
                />
              </div>
              <div className="buttons-container">
                <button
                  className="popup-button cancel"
                  onClick={() => setShowProfessorPopup(false)}
                >
                  Cancel·lar
                </button>
                <button className="popup-button" onClick={handleAddProfessor}>
                  Afegir
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <h2>Professor afegit correctament</h2>
              <p>{successMessage}</p>
              <div className="buttons-container">
                <button
                  className="popup-button"
                  onClick={() => setShowSuccessPopup(false)}
                >
                  Tanca
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CursosPage;
