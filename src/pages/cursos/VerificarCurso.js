import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import './VerificarCurso.css';
import {
  cambiarEstadoCurso,
  crearCurso,
  verificarCursoExistente,
} from '../../services/Cursos_Api';

const VerificarCurso = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    nombreAsignatura,
    añoInicio,
    cuatrimestre,
    profesores,
    estudiantes,
    gestiotasques,
  } = state;

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'none',
  });

  const sortedEstudiantes = React.useMemo(() => {
    let sortedData = [...estudiantes];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedData;
  }, [estudiantes, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'none';
    }
    setSortConfig({ key: direction === 'none' ? null : key, direction });
  };

  const handleConfirmCurso = () => {
    const cursoData = {
      nombreAsignatura,
      añoInicio,
      cuatrimestre,
    };

    verificarCursoExistente(cursoData)
      .then((response) => {
        if (response.status === 409) {
          setShowConfirmPopup(true);
          return null;
        } else if (!response.ok) {
          throw new Error('Error al verificar el curso existente.');
        } else {
          return createCurso();
        }
      })
      .catch((error) => {
        setErrorMessage(error.message);
        console.error('Error al verificar el curso existente:', error);
      });
  };

  const createCurso = () => {
    const newCursoData = {
      nombreAsignatura,
      añoInicio,
      cuatrimestre,
      activo: true,
      profesores: profesores.map((prof) => ({
        nombre: prof.nombre,
        correo: prof.correo,
      })),
      estudiantes: estudiantes.map((estudiante) => ({
        nombre: estudiante.nombre,
        correo: estudiante.correo,
        grupo: estudiante.grupo,
      })),
      periodosEvaluacion: state.periodosEvaluacion,
      githubAsignatura: state.githubAsignatura,
      tokenGithubAsignatura: state.tokenGithub,
      gestionTareas: state.gestiotasques,
    };

    crearCurso(newCursoData)
      .then((response) => {
        const cursoId = response.cursoId;
        navigate(`/cursos/${cursoId}`);
      })
      .catch((error) => {
        setErrorMessage(error.message);
        console.error('Error al crear el curso:', error);
      });
  };

  const handleCambiarEstadoCurso = () => {
    const cursoData = {
      nombreAsignatura,
      añoInicio,
      cuatrimestre,
    };

    cambiarEstadoCurso(cursoData)
      .then(() => {
        setShowConfirmPopup(false);
        createCurso();
      })
      .catch((error) => {
        setErrorMessage(error.message);
        console.error('Error al cambiar el estado del curso existente:', error);
      });
  };

  const handleCancelConfirm = () => {
    setShowConfirmPopup(false);
  };

  return (
    <div className="cursos-page">
      <Sidebar />
      <div className="verificar-curso-container">
        <h1>Verificació del curs</h1>
        <div className="curso-details">
          <p>
            <strong>Nom de l&apos;assignatura:</strong> {nombreAsignatura}
          </p>
          <p>
            <strong>Any d&apos;inici:</strong> {añoInicio}
          </p>
          <p>
            <strong>Quadrimestre:</strong>{' '}
            {cuatrimestre === '1' ? 'Tardor' : 'Primavera'}
          </p>
          <p>
            <strong>Actiu:</strong> Sí
          </p>
          <p>
            <strong>Professors:</strong>{' '}
            {profesores.map((prof) => prof.nombre).join(', ')}
          </p>
          <p>
            <strong>Compte de GitHub de l&apos;assignatura: </strong>{' '}
            {state.githubAsignatura}
          </p>
          <p>
            <strong>Token de GitHub establert: </strong>{' '}
            {state.tokenGithub ? (
              <span className="token-status">
                <span className="tick-icon">✔️</span> Establert
              </span>
            ) : (
              <span className="token-status">
                <span className="cross-icon">❌</span> No establert
              </span>
            )}
          </p>
          <p>
            <strong>Les tasques del curs es gestionen amb: </strong>{' '}
            {state.gestiotasques}
          </p>
        </div>
        <h2>Períodes d&apos;avaluació</h2>
        <div className="evaluation-periods">
          {state.periodosEvaluacion.length > 0 ? (
            state.periodosEvaluacion.map((periodo, index) => {
              const fechaInicioFormateada = new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(periodo.fechaInicio));

              const fechaFinFormateada = new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(periodo.fechaFin));

              return (
                <p key={index}>
                  <strong>Avaluació {index + 1}:</strong> Del{' '}
                  {fechaInicioFormateada} al {fechaFinFormateada}
                </p>
              );
            })
          ) : (
            <p>No hi ha períodes d&apos;avaluació establerts.</p>
          )}
        </div>

        <h2>Estudiants</h2>
        <div className="total-students">
          Nombre total d&apos;estudiants del curs: {estudiantes.length}
        </div>
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('grupo')}>
                  Grup{' '}
                  <span
                    className={`sort-icon ${
                      sortConfig.key === 'grupo' ? sortConfig.direction : 'none'
                    }`}
                  />
                </th>
                <th onClick={() => handleSort('nombre')}>
                  Nom i Cognoms{' '}
                  <span
                    className={`sort-icon ${
                      sortConfig.key === 'nombre'
                        ? sortConfig.direction
                        : 'none'
                    }`}
                  />
                </th>
                <th onClick={() => handleSort('correo')}>
                  Adreça electrònica{' '}
                  <span
                    className={`sort-icon ${
                      sortConfig.key === 'correo'
                        ? sortConfig.direction
                        : 'none'
                    }`}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEstudiantes.map((estudiante, index) => (
                <tr key={index}>
                  <td>{estudiante.grupo}</td>
                  <td>{estudiante.nombre}</td>
                  <td>{estudiante.correo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="form-buttons">
          <button
            type="button"
            className="cancel-button"
            onClick={() =>
              navigate('/cursos/crear', {
                state: {
                  nombreAsignatura,
                  añoInicio,
                  cuatrimestre,
                  selectedProfesores: profesores.map((prof) => prof.id),
                  gestiotasques,
                },
              })
            }
          >
            Tornar per modificar
          </button>
          <button
            type="button"
            className="confirm-button"
            onClick={handleConfirmCurso}
          >
            Confirmar curs
          </button>
        </div>
        {showConfirmPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>
                Ja existeix un curs actiu amb el mateix nom, any i quadrimestre.
                Vols desactivar-lo?
              </p>
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-verification-button"
                  onClick={handleCancelConfirm}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-verification-button"
                  onClick={handleCambiarEstadoCurso}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarCurso;
