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
      setSortedData(curso.nombresEstudiantesSinGrupo.map((_, i) => i)); // Sin orden
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
        console.log('Data curso ', data);
      })
      .catch((error) => {
        setError(error.message);
        console.error('Error al obtener los detalles del curso:', error);
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
          console.error('Error al verificar el curso existente:', error);
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
        console.error('Error al cambiar el estado del curso:', error);
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
        console.error('Error al resolver el conflicto del curso:', error);
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
    console.log('data: ', cursoData);

    modificarCurso(id, cursoData)
      .then(() => {
        console.log('Curso modificado con éxito');
        setIsEditing(false);
        setNewEstudiante({ nombre: '', correo: '' });
        setShowSaveConfirmPopup(false);
        setEstudianteAEliminar(null);

        // Vuelve a ejecutar obtenerDetallesCurso para actualizar los datos
        obtenerDetallesCurso(id)
          .then((data) => {
            setCurso(data);
            setEditedCurso(data);
            setNombresProfesores(data.nombresProfesores || []);
            setSortedData(data.nombresEstudiantesSinGrupo.map((_, i) => i));
            console.log('Dades del curs actualitzades:', data);
          })
          .catch((error) => {
            setError(error.message);
            console.error('Error en recarregar les dades del curs:', error);
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
        console.error('Error al borrar el curso:', error);
      })
      .finally(() => {
        setShowDeleteConfirmPopup(false);
      });
  };

  return (
    <div className="curso-page">
      <Sidebar />
      <div className="curso-content">
        <button className="cursos-back-button" onClick={handleBackClick}>
          Tornar als cursos
        </button>
        {error && <div className="error-message">{error}</div>}
        {curso ? (
          <>
            <div className="edit-controls">
              {isEditing ? (
                <>
                  <button
                    className="save-changes-button"
                    onClick={handleSaveChanges}
                  >
                    Guardar canvis
                  </button>
                  <button
                    className="cancel-canvis-button"
                    onClick={handleEditToggle}
                  >
                    Cancel·lar
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="modify-curs-button"
                    onClick={handleEditToggle}
                  >
                    Modificar curs
                  </button>
                  <button
                    className="delete-curs-button"
                    onClick={() => setShowDeleteConfirmPopup(true)}
                  >
                    Esborrar curs
                  </button>
                </>
              )}
            </div>

            <div className="curso-details">
              <h1 className="curso-title">
                {isEditing ? (
                  <input
                    type="text"
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
              <div className="curso-info">
                <div className="curso-info-content">
                  <p>
                    <strong>Any d&apos;inici:</strong>{' '}
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedCurso.añoInicio}
                        onChange={(e) =>
                          setEditedCurso({
                            ...editedCurso,
                            añoInicio: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    ) : (
                      curso.añoInicio
                    )}
                  </p>
                  <p>
                    <strong>Quadrimestre:</strong>{' '}
                    {isEditing ? (
                      <select
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
                    ) : curso.cuatrimestre === 1 ? (
                      'Tardor'
                    ) : (
                      'Primavera'
                    )}
                  </p>
                  <p>
                    <strong>Compte de GitHub de l&apos;assignatura:</strong>{' '}
                    {isEditing ? (
                      <input
                        type="text"
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
                        className="github-link"
                      >
                        {curso.githubAsignatura}
                      </a>
                    ) : (
                      <span className="token-status">
                        <span className="cross-icon">❌</span> No establert
                      </span>
                    )}
                  </p>

                  <p>
                    <strong>
                      Token del compte de GitHub de l&apos;assignatura:
                    </strong>{' '}
                    {isEditing ? (
                      <input
                        type="password"
                        value={editedCurso.tokenGithub}
                        onChange={(e) =>
                          setEditedCurso({
                            ...editedCurso,
                            tokenGithub: e.target.value,
                          })
                        }
                      />
                    ) : curso.tokenGithub ? (
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
                    <strong>Les tasques del curs es gestionen amb:</strong>{' '}
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
                          />
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
                          />
                          Taiga
                        </label>
                      </div>
                    ) : (
                      curso.gestionTareas
                    )}
                  </p>
                  <p>
                    <strong>Nombre total d&apos;estudiants:</strong>{' '}
                    {(curso.nombresEstudiantesSinGrupo?.length || 0) +
                      (curso.equipos?.reduce(
                        (total, equipo) =>
                          total +
                          (equipo.miembros
                            ? Object.keys(equipo.miembros).length
                            : 0),
                        0,
                      ) || 0)}
                  </p>
                  <p>
                    <strong>Nombre total d&apos;equips:</strong>{' '}
                    {curso.equipos?.length || 0}
                  </p>
                  <p>
                    <strong>Nombre total d&apos;estudiants sense equip:</strong>{' '}
                    {curso.nombresEstudiantesSinGrupo?.length || 0}
                  </p>
                </div>
                <div className="toggle-container">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={curso.activo}
                      onChange={handleToggleEstado}
                      disabled={isEditing}
                    />
                    <span
                      className={`slider ${curso.activo ? 'activo' : 'inactivo'} ${
                        isEditing ? 'disabled' : ''
                      }`}
                    >
                      {curso.activo ? 'ACTIU' : 'INACTIU'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="curso-lists">
              <div className="curso-section">
                <h2>Professors</h2>
                {isEditing ? (
                  <div className="profesores-list">
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
                              onChange={() =>
                                handleProfessorSelection(profesor)
                              }
                              disabled={isCurrentUser}
                            />
                            {profesor.nombre}
                            {isCurrentUser && (
                              <span className="self-indicator">(JO)</span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="curso-list">
                    {nombresProfesores && nombresProfesores.length > 0 ? (
                      nombresProfesores.map((nombre, index) => (
                        <li key={index} className="curso-list-item">
                          {nombre}
                        </li>
                      ))
                    ) : (
                      <p>No hi ha professors per mostrar.</p>
                    )}
                  </ul>
                )}
              </div>
              <div className="curso-section">
                <h2>Equips</h2>
                <button
                  className={`crear-equipo-curso-button ${isEditing ? 'disabled' : ''}`}
                  onClick={() => navigate(`/equipos/crear?cursoId=${curso.id}`)}
                  disabled={isEditing}
                >
                  Crear Equip
                </button>

                <div className="filter-buttons">
                  <button
                    className={!mostrarMisEquipos ? 'active-filter' : ''}
                    onClick={() => setMostrarMisEquipos(false)}
                  >
                    Tots els equips
                  </button>
                  <button
                    className={mostrarMisEquipos ? 'active-filter' : ''}
                    onClick={() => setMostrarMisEquipos(true)}
                  >
                    Els meus equips
                  </button>
                </div>
                <div className="equipos-container">
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
                          className="equipo-card"
                          style={{ borderColor: COLORS[index % COLORS.length] }}
                          onClick={() =>
                            navigate(`/equipos/${equipo.id_equipo}`)
                          }
                        >
                          <div
                            className="equipo-card-header"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div className="equipo-header-content">
                              <span>{equipo.nombreEquipo}</span>
                              {equipo.validado && (
                                <div className="equipo-validado">
                                  <i className="fas fa-check-circle"></i>{' '}
                                  Validat
                                </div>
                              )}
                            </div>
                            <button
                              className="toggle-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEquipoExpand(index);
                              }}
                            >
                              {expandedEquipos[index] ? '▲' : '▼'}
                            </button>
                          </div>
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
                                      className="equipo-member"
                                    >
                                      <p>
                                        {nombre} ({grupo || 'Sense Grup'})
                                      </p>
                                    </div>
                                  ))
                              ) : (
                                <p>No hi ha membres en aquest equip.</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <p>Encara no hi ha cap equip format.</p>
                  )}
                </div>
              </div>
              <div className="curso-section">
                <h2>Estudiants sense equip</h2>
                <table className="curso-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort('nombresEstudiantesSinGrupo')}
                      >
                        Nom i Cognoms{' '}
                        <span
                          className={`sort-icon ${
                            sortConfig.key === 'nombresEstudiantesSinGrupo'
                              ? sortConfig.direction
                              : 'none'
                          }`}
                        />
                      </th>
                      <th
                        onClick={() => handleSort('gruposEstudiantesSinGrupo')}
                      >
                        Grup{' '}
                        <span
                          className={`sort-icon ${
                            sortConfig.key === 'gruposEstudiantesSinGrupo'
                              ? sortConfig.direction
                              : 'none'
                          }`}
                        />
                      </th>
                      <th
                        onClick={() => handleSort('correosEstudiantesSinGrupo')}
                      >
                        Adreça electrònica{' '}
                        <span
                          className={`sort-icon ${
                            sortConfig.key === 'correosEstudiantesSinGrupo'
                              ? sortConfig.direction
                              : 'none'
                          }`}
                        />
                      </th>
                      {isEditing && <th>Accions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData && sortedData.length > 0 ? (
                      sortedData.map((index) => (
                        <tr key={index}>
                          <td>{curso.nombresEstudiantesSinGrupo[index]}</td>
                          <td>{curso.gruposEstudiantesSinGrupo[index]}</td>
                          <td>{curso.correosEstudiantesSinGrupo[index]}</td>
                          {isEditing && (
                            <td>
                              <button
                                className="delete-button"
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
                        <td colSpan={isEditing ? '4' : '3'}>
                          No hi ha cap estudiant sense equip.
                        </td>
                      </tr>
                    )}

                    {isEditing && (
                      <tr>
                        <td>
                          <input
                            type="text"
                            name="nombre"
                            value={newEstudiante.nombre}
                            onChange={handleInputChange}
                            placeholder="Nom i Cognoms"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="grupo"
                            value={newEstudiante.grupo}
                            onChange={handleInputChange}
                            placeholder="Grup"
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            name="correo"
                            value={newEstudiante.correo}
                            onChange={handleInputChange}
                            placeholder="Adreça electrònica"
                          />
                        </td>
                        <td>
                          <button
                            className="add-button"
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
          <p>Carregant les dades del curs...</p>
        )}
        {showConfirmPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>
                Estàs segur/a de que vols{' '}
                {curso.activo ? 'desactivar' : 'activar'} el curs?
              </p>
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelConfirm}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleConfirmEstado}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteConfirmPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>
                Estàs segur/a de que vols eliminar el curs{' '}
                <strong>{curso.nombreAsignatura}</strong>?
              </p>
              <p>
                <strong>AQUESTA ACCIÓ NO ES POT DESFER</strong>
              </p>
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowDeleteConfirmPopup(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleConfirmDeleteCourse}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}

        {showConflictPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>
                Ja existeix un curs actiu amb el mateix nom, any i quadrimestre.
                Vols desactivar-lo per poder activar aquest?
              </p>
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelConflict}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleResolveConflict}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {showAddConfirmPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>
                Estàs segur/a de que vols afegir al Curs{' '}
                <strong>{curso.nombreAsignatura}</strong> a l&apos;estudiant{' '}
                <strong>{newEstudiante.nombre}</strong> amb correu{' '}
                <strong>{newEstudiante.correo}</strong> i grup{' '}
                <strong>{newEstudiante.grupo}</strong>?
              </p>
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddConfirmPopup(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={() => {
                    handleSaveChanges();
                    setShowAddConfirmPopup(false);
                  }}
                >
                  Si
                </button>
              </div>
            </div>
          </div>
        )}
        {showSaveConfirmPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>Estàs segur/a de que vols realitzar aquests canvis?</p>
              {nombresProfesores.length === 0 && (
                <p className="creating-error-message">
                  No pots eliminar a tots els professors d&apos;aquest curs i no
                  afegir-ne a cap.
                </p>
              )}
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelSaveChanges}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleConfirmSaveChanges}
                  disabled={nombresProfesores.length === 0}
                >
                  Si
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteStudentPopup && (
          <div className="confirm-popup">
            <div className="popup-content">
              <p>
                Estàs segur/a de que vols eliminar del curs{' '}
                <strong>{curso.nombreAsignatura}</strong> l&apos;estudiant{' '}
                <strong>{estudianteAEliminar?.nombre}</strong>?
              </p>
              <div className="popup-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowDeleteStudentPopup(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={() => {
                    handleSaveChanges();
                    setShowDeleteStudentPopup(false);
                  }}
                >
                  Si
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CursoPage;
