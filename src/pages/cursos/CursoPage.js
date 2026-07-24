import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import './CursoPage.css';
import {
  obtenerDetallesCurso,
  cambiarEstadoCurso,
  verificarCursoExistente,
  obtenerProfesoresDisponibles,
  modificarCurso,
  borrarCurso,
} from '../../services/Cursos_Api.js';

const CursoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [curso, setCurso] = useState(null);
  const [error, setError] = useState('');
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showConflictPopup, setShowConflictPopup] = useState(false);
  const [showAddConfirmPopup, setShowAddConfirmPopup] = useState(false);
  const [showSaveConfirmPopup, setShowSaveConfirmPopup] = useState(false);
  const [showDeleteConfirmPopup, setShowDeleteConfirmPopup] = useState(false);
  const [showDeleteStudentPopup, setShowDeleteStudentPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCurso, setEditedCurso] = useState(null);
  const [newEstudiante, setNewEstudiante] = useState({
    nombre: '',
    correo: '',
  });
  const [profesoresDisponibles, setProfesoresDisponibles] = useState([]);
  const [nombresProfesores, setNombresProfesores] = useState([]);
  const [profesoresBorrar, setProfesoresBorrar] = useState([]);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState(null);
  const [mostrarMisEquipos, setMostrarMisEquipos] = useState(false);
  const [expandedEquipos, setExpandedEquipos] = useState({});

  const COLORS = [
    '#6C9975',
    '#BB6365',
    '#785B75',
    '#5E807F',
    '#BA5A31',
    '#355C7D',
    '#F4A261',
    '#E76F51',
    '#2A9D8F',
    '#264653',
    '#A8DADC',
    '#457B9D',
    '#E9C46A',
    '#F4A3B3',
    '#D4A5A5',
    '#B5838D',
  ];

  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'none',
  });
  const [sortedData, setSortedData] = React.useState([]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'none';
    }

    setSortConfig({ key: direction === 'none' ? null : key, direction });

    if (direction === 'none') {
      setSortedData(curso.nombresEstudiantesSinGrupo.map((_, i) => i));
      return;
    }

    const sortedIndexes = [
      ...Array(curso.nombresEstudiantesSinGrupo.length).keys(),
    ].sort((a, b) => {
      const valA = curso[key][a]?.toLowerCase() || '';
      const valB = curso[key][b]?.toLowerCase() || '';

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setSortedData(sortedIndexes);
  };

  useEffect(() => {
    obtenerDetallesCurso(id)
      .then((data) => {
        setCurso(data);
        setEditedCurso(data);
        setNombresProfesores(data.nombresProfesores || []);
        setSortedData(data.nombresEstudiantesSinGrupo.map((_, i) => i));
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [id, location]);

  const handleBackClick = () => {
    navigate('/cursos');
  };

  const handleToggleEstado = () => {
    if (curso.activo) {
      setShowConfirmPopup(true);
    } else {
      verificarCursoExistente(curso)
        .then((response) => {
          if (response.status === 409) {
            setShowConflictPopup(true);
          } else if (!response.ok) {
            throw new Error('Error al verificar el curso existente.');
          } else {
            handleConfirmEstado();
          }
        })
        .catch((error) => {
          setError(error.message);
        });
    }
  };

  const handleConfirmEstado = () => {
    cambiarEstadoCurso({
      id: curso.id,
      nombreAsignatura: curso.nombreAsignatura,
      añoInicio: curso.añoInicio,
      cuatrimestre: curso.cuatrimestre,
    })
      .then(() => {
        setCurso((prevCurso) => ({
          ...prevCurso,
          activo: !prevCurso.activo,
        }));
        setShowConfirmPopup(false);
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleCancelConfirm = () => {
    setShowConfirmPopup(false);
  };

  const handleResolveConflict = () => {
    cambiarEstadoCurso({
      nombreAsignatura: curso.nombreAsignatura,
      añoInicio: curso.añoInicio,
      cuatrimestre: curso.cuatrimestre,
    })
      .then(() => {
        setShowConflictPopup(false);
        handleConfirmEstado();
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleCancelConflict = () => {
    setShowConflictPopup(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedCurso(curso);
    } else {
      obtenerProfesoresDisponibles()
        .then((data) => setProfesoresDisponibles(data))
        .catch((error) => {
          console.error('Error al obtener los profesores:', error);
        });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    setShowSaveConfirmPopup(true);
  };

  const handleConfirmSaveChanges = () => {
    const cursoData = {
      nombreAsignatura: editedCurso.nombreAsignatura,
      añoInicio: editedCurso.añoInicio,
      cuatrimestre: editedCurso.cuatrimestre,
      githubAsignatura: editedCurso.githubAsignatura,
      tokenGithubAsignatura: editedCurso.tokenGithub,
      gestionTareas: editedCurso.gestionTareas,
      estudiantesAñadir: newEstudiante.nombre
        ? [
            {
              nombre: newEstudiante.nombre,
              correo: newEstudiante.correo,
              grupo: newEstudiante.grupo,
            },
          ]
        : [],
      estudiantesBorrar: estudianteAEliminar ? [estudianteAEliminar] : [],
      profesoresAñadir: nombresProfesores.map((nombre) => {
        const profesor = profesoresDisponibles.find(
          (prof) => prof.nombre === nombre,
        );
        return { nombre: profesor.nombre, correo: profesor.correo };
      }),
      profesoresBorrar,
    };

    modificarCurso(id, cursoData)
      .then(() => {
        setIsEditing(false);
        setNewEstudiante({ nombre: '', correo: '' });
        setShowSaveConfirmPopup(false);
        setEstudianteAEliminar(null);

        obtenerDetallesCurso(id)
          .then((data) => {
            setCurso(data);
            setEditedCurso(data);
            setNombresProfesores(data.nombresProfesores || []);
            setSortedData(data.nombresEstudiantesSinGrupo.map((_, i) => i));
          })
          .catch((error) => {
            setError(error.message);
          });
      })
      .catch(() => {
        setError('Error en modificar el curs');
      });
  };

  const handleCancelSaveChanges = () => {
    setShowSaveConfirmPopup(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEstudiante((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfessorSelection = (profesor) => {
    if (nombresProfesores.includes(profesor.nombre)) {
      setNombresProfesores(
        nombresProfesores.filter((p) => p !== profesor.nombre),
      );
      setProfesoresBorrar((prev) => [...prev, profesor]);
    } else {
      setNombresProfesores([...nombresProfesores, profesor.nombre]);
      setProfesoresBorrar((prev) =>
        prev.filter((p) => p.nombre !== profesor.nombre),
      );
    }
  };

  const handleDeleteStudent = (estudiante) => {
    setEstudianteAEliminar(estudiante);
    setShowDeleteStudentPopup(true);
  };

  const toggleEquipoExpand = (index) => {
    setExpandedEquipos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const validarCorreo = (correo) => {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(correo);
  };

  const handleConfirmDeleteCourse = () => {
    borrarCurso(id, localStorage.getItem('jwtToken'))
      .then(() => {
        navigate('/cursos');
      })
      .catch((error) => {
        setError('Error al intentar borrar el curs.');
      })
      .finally(() => {
        setShowDeleteConfirmPopup(false);
      });
  };

  return (
    <div className="curso-page">
      <Sidebar />
      <div className="content">
        {error && <div className="error-message">{error}</div>}

        {curso ? (
          <>
            {/* --- CABECERA --- */}
            <div className="page-header">
              <div className="header-titles">
                <button className="btn-back" onClick={handleBackClick}>
                  ← Tornar als cursos
                </button>
                <h1>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-input title-input"
                      value={editedCurso.nombreAsignatura}
                      onChange={(e) =>
                        setEditedCurso({
                          ...editedCurso,
                          nombreAsignatura: e.target.value,
                        })
                      }
                    />
                  ) : (
                    curso.nombreAsignatura
                  )}
                </h1>
              </div>

              <div className="header-actions">
                {isEditing ? (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={handleEditToggle}
                    >
                      Cancel·lar
                    </button>
                    <button className="btn-primary" onClick={handleSaveChanges}>
                      Guardar canvis
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-danger"
                      onClick={() => setShowDeleteConfirmPopup(true)}
                    >
                      Esborrar curs
                    </button>
                    <button className="btn-primary" onClick={handleEditToggle}>
                      Modificar curs
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* --- INFO GENERAL DEL CURSO --- */}
            <div className="modern-card info-card">
              <div className="info-header">
                <h2>Detalls de l&apos;Assignatura</h2>
                <div className="toggle-container">
                  <label className="modern-switch">
                    <input
                      type="checkbox"
                      checked={curso.activo}
                      onChange={handleToggleEstado}
                      disabled={isEditing}
                    />
                    <span
                      className={`slider ${isEditing ? 'disabled' : ''}`}
                    ></span>
                  </label>
                  <span
                    className={`status-text ${curso.activo ? 'active' : 'inactive'}`}
                  >
                    {curso.activo ? 'Actiu' : 'Inactiu'}
                  </span>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Any d&apos;inici</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="form-input"
                      value={editedCurso.añoInicio}
                      onChange={(e) =>
                        setEditedCurso({
                          ...editedCurso,
                          añoInicio: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  ) : (
                    <span className="value">{curso.añoInicio}</span>
                  )}
                </div>

                <div className="info-item">
                  <span className="label">Quadrimestre</span>
                  {isEditing ? (
                    <select
                      className="form-input"
                      value={editedCurso.cuatrimestre}
                      onChange={(e) =>
                        setEditedCurso({
                          ...editedCurso,
                          cuatrimestre: parseInt(e.target.value, 10),
                        })
                      }
                    >
                      <option value={1}>Tardor</option>
                      <option value={2}>Primavera</option>
                    </select>
                  ) : (
                    <span className="value">
                      {curso.cuatrimestre === 1 ? 'Tardor' : 'Primavera'}
                    </span>
                  )}
                </div>

                <div className="info-item">
                  <span className="label">Compte de GitHub</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-input"
                      value={editedCurso.githubAsignatura}
                      onChange={(e) =>
                        setEditedCurso({
                          ...editedCurso,
                          githubAsignatura: e.target.value,
                        })
                      }
                    />
                  ) : curso.githubAsignatura ? (
                    <a
                      href={`https://github.com/${curso.githubAsignatura}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-link value"
                    >
                      {curso.githubAsignatura}
                    </a>
                  ) : (
                    <span className="value muted">❌ No establert</span>
                  )}
                </div>

                <div className="info-item">
                  <span className="label">Token de GitHub</span>
                  {isEditing ? (
                    <input
                      type="password"
                      className="form-input"
                      value={editedCurso.tokenGithub}
                      onChange={(e) =>
                        setEditedCurso({
                          ...editedCurso,
                          tokenGithub: e.target.value,
                        })
                      }
                    />
                  ) : curso.tokenGithub ? (
                    <span className="value success">✔️ Establert</span>
                  ) : (
                    <span className="value muted">❌ No establert</span>
                  )}
                </div>

                <div className="info-item">
                  <span className="label">Gestió de tasques</span>
                  {isEditing ? (
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="tasques"
                          value="GitHub"
                          checked={editedCurso.gestionTareas === 'GitHub'}
                          onChange={(e) =>
                            setEditedCurso({
                              ...editedCurso,
                              gestionTareas: e.target.value,
                            })
                          }
                        />{' '}
                        GitHub
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="tasques"
                          value="Taiga"
                          checked={editedCurso.gestionTareas === 'Taiga'}
                          onChange={(e) =>
                            setEditedCurso({
                              ...editedCurso,
                              gestionTareas: e.target.value,
                            })
                          }
                        />{' '}
                        Taiga
                      </label>
                    </div>
                  ) : (
                    <span className="value">{curso.gestionTareas}</span>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="info-item stats-box">
                  <span className="label">Total Estudiants</span>
                  <span className="value big">
                    {(curso.nombresEstudiantesSinGrupo?.length || 0) +
                      (curso.equipos?.reduce(
                        (total, equipo) =>
                          total +
                          (equipo.miembros
                            ? Object.keys(equipo.miembros).length
                            : 0),
                        0,
                      ) || 0)}
                  </span>
                </div>
                <div className="info-item stats-box">
                  <span className="label">Total Equips</span>
                  <span className="value big">
                    {curso.equipos?.length || 0}
                  </span>
                </div>
                <div className="info-item stats-box">
                  <span className="label">Sense Equip</span>
                  <span className="value big warning">
                    {curso.nombresEstudiantesSinGrupo?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* --- PROFESORES --- */}
            <div className="modern-card">
              <h2>Professors</h2>
              {isEditing ? (
                <div className="profesores-grid">
                  {profesoresDisponibles.map((profesor, index) => {
                    const isCurrentUser =
                      profesor.id === parseInt(localStorage.getItem('id'));
                    return (
                      <div
                        key={index}
                        className={`professor-item ${isCurrentUser ? 'disabled' : ''}`}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={nombresProfesores.includes(
                              profesor.nombre,
                            )}
                            onChange={() => handleProfessorSelection(profesor)}
                            disabled={isCurrentUser}
                          />
                          {profesor.nombre}{' '}
                          {isCurrentUser && (
                            <span className="self-indicator">(JO)</span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="profesores-badges">
                  {nombresProfesores && nombresProfesores.length > 0 ? (
                    nombresProfesores.map((nombre, index) => (
                      <span key={index} className="badge badge-professor">
                        {nombre}
                      </span>
                    ))
                  ) : (
                    <p className="muted">No hi ha professors per mostrar.</p>
                  )}
                </div>
              )}
            </div>

            {/* --- EQUIPOS --- */}
            <div className="modern-card">
              <div className="section-header">
                <h2>Equips</h2>
                <button
                  className="btn-primary btn-small"
                  onClick={() => navigate(`/equipos/crear?cursoId=${curso.id}`)}
                  disabled={isEditing}
                >
                  Crear Equip
                </button>
              </div>

              <div className="table-tabs">
                <button
                  className={`tab ${!mostrarMisEquipos ? 'active' : ''}`}
                  onClick={() => setMostrarMisEquipos(false)}
                >
                  Tots els equips
                </button>
                <button
                  className={`tab ${mostrarMisEquipos ? 'active' : ''}`}
                  onClick={() => setMostrarMisEquipos(true)}
                >
                  Els meus equips
                </button>
              </div>

              <div className="equipos-grid">
                {curso.equipos && curso.equipos.length > 0 ? (
                  curso.equipos
                    .filter((equipo) =>
                      mostrarMisEquipos
                        ? equipo.idProfe ===
                          parseInt(localStorage.getItem('id'))
                        : true,
                    )
                    .map((equipo, index) => (
                      <div
                        key={index}
                        className="equipo-card-modern"
                        style={{
                          borderTop: `4px solid ${COLORS[index % COLORS.length]}`,
                        }}
                        onClick={() => navigate(`/equipos/${equipo.id_equipo}`)}
                      >
                        <div className="equipo-card-header">
                          <span className="equipo-title">
                            {equipo.nombreEquipo}
                          </span>
                          <button
                            className="toggle-button-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEquipoExpand(index);
                            }}
                          >
                            {expandedEquipos[index] ? '▲' : '▼'}
                          </button>
                        </div>
                        {equipo.validado && (
                          <div className="equipo-validado-badge">
                            ✔️ Validat
                          </div>
                        )}

                        {expandedEquipos[index] && (
                          <div className="equipo-card-body">
                            {equipo.miembros &&
                            Object.keys(equipo.miembros).length > 0 ? (
                              Object.entries(equipo.miembros)
                                .sort(([nombreA], [nombreB]) =>
                                  nombreA.localeCompare(nombreB),
                                )
                                .map(([nombre, grupo], miembroIndex) => (
                                  <div
                                    key={miembroIndex}
                                    className="equipo-member-item"
                                  >
                                    <span className="member-name">
                                      {nombre}
                                    </span>
                                    <span className="member-group">
                                      {grupo || 'Sense Grup'}
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <p className="muted small">No hi ha membres.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="muted">Encara no hi ha cap equip format.</p>
                )}
              </div>
            </div>

            {/* --- ESTUDIANTES SIN EQUIPO --- */}
            <div className="modern-card">
              <h2>Estudiants sense equip</h2>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort('nombresEstudiantesSinGrupo')}
                        className="clickable-th"
                      >
                        Nom i Cognoms{' '}
                        {sortConfig.key === 'nombresEstudiantesSinGrupo' &&
                          (sortConfig.direction === 'asc'
                            ? '▲'
                            : sortConfig.direction === 'desc'
                              ? '▼'
                              : '')}
                      </th>
                      <th
                        onClick={() => handleSort('gruposEstudiantesSinGrupo')}
                        className="clickable-th"
                      >
                        Grup{' '}
                        {sortConfig.key === 'gruposEstudiantesSinGrupo' &&
                          (sortConfig.direction === 'asc'
                            ? '▲'
                            : sortConfig.direction === 'desc'
                              ? '▼'
                              : '')}
                      </th>
                      <th
                        onClick={() => handleSort('correosEstudiantesSinGrupo')}
                        className="clickable-th"
                      >
                        Adreça electrònica{' '}
                        {sortConfig.key === 'correosEstudiantesSinGrupo' &&
                          (sortConfig.direction === 'asc'
                            ? '▲'
                            : sortConfig.direction === 'desc'
                              ? '▼'
                              : '')}
                      </th>
                      {isEditing && <th>Accions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData && sortedData.length > 0 ? (
                      sortedData.map((index) => (
                        <tr key={index}>
                          <td className="fw-bold">
                            {curso.nombresEstudiantesSinGrupo[index]}
                          </td>
                          <td>{curso.gruposEstudiantesSinGrupo[index]}</td>
                          <td>{curso.correosEstudiantesSinGrupo[index]}</td>
                          {isEditing && (
                            <td>
                              <button
                                className="table-button delete-button"
                                onClick={() =>
                                  handleDeleteStudent({
                                    nombre:
                                      curso.nombresEstudiantesSinGrupo[index],
                                    correo:
                                      curso.correosEstudiantesSinGrupo[index],
                                  })
                                }
                              >
                                Eliminar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isEditing ? '4' : '3'}
                          className="text-center muted"
                        >
                          No hi ha cap estudiant sense equip.
                        </td>
                      </tr>
                    )}

                    {isEditing && (
                      <tr className="add-student-row">
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            name="nombre"
                            value={newEstudiante.nombre}
                            onChange={handleInputChange}
                            placeholder="Nom i Cognoms"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            name="grupo"
                            value={newEstudiante.grupo}
                            onChange={handleInputChange}
                            placeholder="Grup"
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            className="form-input"
                            name="correo"
                            value={newEstudiante.correo}
                            onChange={handleInputChange}
                            placeholder="Adreça electrònica"
                          />
                        </td>
                        <td>
                          <button
                            className="table-button add-button"
                            onClick={() => {
                              if (validarCorreo(newEstudiante.correo)) {
                                setShowAddConfirmPopup(true);
                                setError('');
                              } else {
                                setError('El correu proporcionat no és vàlid.');
                              }
                            }}
                          >
                            Afegir
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="loading-text">Carregant les dades del curs...</p>
        )}

        {/* --- POPUPS --- */}
        {(showConfirmPopup ||
          showDeleteConfirmPopup ||
          showConflictPopup ||
          showAddConfirmPopup ||
          showSaveConfirmPopup ||
          showDeleteStudentPopup) && (
          <div className="popup-overlay">
            <div className="popup">
              {showConfirmPopup && (
                <>
                  <h2>Confirmació</h2>
                  <p>
                    Estàs segur/a de que vols{' '}
                    {curso.activo ? 'desactivar' : 'activar'} el curs?
                  </p>
                  <div className="buttons-container">
                    <button
                      className="popup-button cancel"
                      onClick={handleCancelConfirm}
                    >
                      No
                    </button>
                    <button
                      className="popup-button"
                      onClick={handleConfirmEstado}
                    >
                      Sí
                    </button>
                  </div>
                </>
              )}

              {showDeleteConfirmPopup && (
                <>
                  <h2>Esborrar Curs</h2>
                  <p>
                    Estàs segur/a de que vols eliminar el curs{' '}
                    <strong>{curso.nombreAsignatura}</strong>?
                  </p>
                  <p className="danger-text">Aquesta acció no es pot desfer.</p>
                  <div className="buttons-container">
                    <button
                      className="popup-button cancel"
                      onClick={() => setShowDeleteConfirmPopup(false)}
                    >
                      No
                    </button>
                    <button
                      className="popup-button danger"
                      onClick={handleConfirmDeleteCourse}
                    >
                      Sí, esborrar
                    </button>
                  </div>
                </>
              )}

              {showConflictPopup && (
                <>
                  <h2>Conflicte de Curs</h2>
                  <p>
                    Ja existeix un curs actiu amb el mateix nom, any i
                    quadrimestre. Vols desactivar-lo per poder activar aquest?
                  </p>
                  <div className="buttons-container">
                    <button
                      className="popup-button cancel"
                      onClick={handleCancelConflict}
                    >
                      No
                    </button>
                    <button
                      className="popup-button"
                      onClick={handleResolveConflict}
                    >
                      Sí
                    </button>
                  </div>
                </>
              )}

              {showAddConfirmPopup && (
                <>
                  <h2>Afegir Estudiant</h2>
                  <p>
                    Estàs segur/a de que vols afegir a{' '}
                    <strong>{newEstudiante.nombre}</strong> (
                    {newEstudiante.correo}) al grup{' '}
                    <strong>{newEstudiante.grupo}</strong>?
                  </p>
                  <div className="buttons-container">
                    <button
                      className="popup-button cancel"
                      onClick={() => setShowAddConfirmPopup(false)}
                    >
                      No
                    </button>
                    <button
                      className="popup-button"
                      onClick={() => {
                        handleSaveChanges();
                        setShowAddConfirmPopup(false);
                      }}
                    >
                      Sí
                    </button>
                  </div>
                </>
              )}

              {showSaveConfirmPopup && (
                <>
                  <h2>Guardar Canvis</h2>
                  <p>Estàs segur/a de que vols realitzar aquests canvis?</p>
                  {nombresProfesores.length === 0 && (
                    <p className="danger-text">
                      No pots eliminar a tots els professors. Has de deixar
                      almenys un.
                    </p>
                  )}
                  <div className="buttons-container">
                    <button
                      className="popup-button cancel"
                      onClick={handleCancelSaveChanges}
                    >
                      No
                    </button>
                    <button
                      className="popup-button"
                      onClick={handleConfirmSaveChanges}
                      disabled={nombresProfesores.length === 0}
                    >
                      Sí, guardar
                    </button>
                  </div>
                </>
              )}

              {showDeleteStudentPopup && (
                <>
                  <h2>Eliminar Estudiant</h2>
                  <p>
                    Estàs segur/a de que vols eliminar l&apos;estudiant{' '}
                    <strong>{estudianteAEliminar?.nombre}</strong>?
                  </p>
                  <div className="buttons-container">
                    <button
                      className="popup-button cancel"
                      onClick={() => setShowDeleteStudentPopup(false)}
                    >
                      No
                    </button>
                    <button
                      className="popup-button danger"
                      onClick={() => {
                        handleSaveChanges();
                        setShowDeleteStudentPopup(false);
                      }}
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CursoPage;
