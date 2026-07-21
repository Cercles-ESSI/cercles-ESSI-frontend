import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import {
  getEquipoDetalle,
  borrarEquipo,
  salirEquipo,
  borrarMiembros,
  añadirMiembros,
  getEstudiantesCurso,
  validarOrganizacion,
  confirmarOrganizacion,
  disconnectOrganizacion,
  disconnectProyecto,
  validarProyecto,
  confirmarProyecto,
} from '../../services/Equipos_Api';
import {
  isEvaluacionActiva,
  isEvaluacionRealizada,
  getEvaluacionActivaId,
} from '../../services/Evaluaciones_Api';

import './EquipoPage.css';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

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

const EquipoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [estudiantesSinEquipo, setEstudiantesSinEquipo] = useState([]);
  const [miembrosAEliminar, setMiembrosAEliminar] = useState([]);
  const [miembrosAAgregar, setMiembrosAAgregar] = useState([]);
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);

  const [showConfirmChangesPopup, setShowConfirmChangesPopup] = useState(false);
  const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);
  const [showDisconnectPopupTaiga, setShowDisconnectPopupTaiga] =
    useState(false);

  const [gitOrgUrl, setGitOrgUrl] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [comprobandoValidacion, setComprobandoValidacion] = useState(false);
  const [gitOrganizacion, setGitOrganizacion] = useState(null);
  const [estIds, setEstIds] = useState(null);

  const [TaigaUrl, setTaigaUrl] = useState('');
  const [comprobandoValidacionT, setComprobandoValidacionT] = useState(false);
  const [validationResultsT, setValidationResultsT] = useState(null);
  const [taigaProyecto, setTaigaProyecto] = useState(null);

  const token = localStorage.getItem('jwtToken');
  const idEstudiante = parseInt(localStorage.getItem('id'));
  const isProfesor = localStorage.getItem('rol') === 'Profesor';
  const [evaluacionActiva, setEvaluacionActiva] = useState(false);
  const [evaluacionRealizada, setEvaluacionRealizada] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEstudiantesSinEquipo = estudiantesSinEquipo.filter(
    (estudiante) =>
      estudiante.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    const fetchEquipoDetalle = async () => {
      try {
        setLoading(true);
        const equipoData = await getEquipoDetalle(id, token);
        setEquipo(equipoData);
        const estudiantesIds = equipoData.estudiantes.map(
          (estudiante) => estudiante.id,
        );
        setEstIds(estudiantesIds);
        setGitOrganizacion(equipoData.gitOrganizacion);
      } catch (error) {
        setError("No s'ha pogut carregar la informació de l'equip.");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipoDetalle();
  }, [id, token]);

  useEffect(() => {
    if (!equipo) return;

    const fetchEvaluacionStatus = async () => {
      try {
        if (!isProfesor) {
          const evaluacionData = await isEvaluacionActiva(equipo.id, token);
          const evaluacionId = await getEvaluacionActivaId(equipo.id, token);
          const realizada = await isEvaluacionRealizada(
            idEstudiante,
            evaluacionId,
            token,
          );

          setEvaluacionActiva(evaluacionData);
          setEvaluacionRealizada(realizada);
        }
      } catch (error) {
        console.error('Error al comprobar el estado de la evaluación:', error);
      }
    };

    fetchEvaluacionStatus();
  }, [equipo]);

  const handleValidateGitOrg = async () => {
    try {
      setComprobandoValidacion(true);
      const resultados = await validarOrganizacion(
        equipo.evaluadorId,
        equipo.estudiantes.map((miembro) => miembro.id),
        gitOrgUrl,
        equipo.githubAsignatura,
        equipo.tokenGithub,
        token,
      );
      setValidationResults(resultados);
    } catch (error) {
      setError('Error al validar la organización.');
    }
  };

  const handleConfirmGitOrg = async () => {
    try {
      await confirmarOrganizacion(equipo.id, gitOrgUrl, token);
      alert('Organización confirmada con éxito.');
      const updatedEquipo = await getEquipoDetalle(id, token);
      setEquipo(updatedEquipo);
      setGitOrganizacion(updatedEquipo.gitOrganizacion);
    } catch (error) {
      setError('Error al confirmar la organización.');
    }
  };

  const handleValidateTaiga = async () => {
    try {
      setComprobandoValidacionT(true);
      const resultados = await validarProyecto(
        equipo.evaluadorId,
        equipo.estudiantes.map((miembro) => miembro.id),
        TaigaUrl,
        equipo.taigaUserProf,
        token,
      );
      setValidationResultsT(resultados);
      if (
        !(
          resultados?.professoratEsMiembroT &&
          resultados?.todosUsuariosTaigaConfigurados &&
          resultados?.todosMiembrosEnProyecto &&
          resultados?.proyectoPublico
        )
      ) {
        alert(
          'Encara hi ha requisits sense complir. Si us plau, revisa la configuració a Taiga abans de tornar a validar.',
        );
      }
    } catch (error) {
      setError('Error al validar el projecte.');
    }
  };

  const handleConfirmTaiga = async () => {
    try {
      await confirmarProyecto(equipo.id, TaigaUrl, token);
      alert('Projecte confirmat amb èxit.');
      const updatedEquipo = await getEquipoDetalle(id, token);
      setEquipo(updatedEquipo);
      setTaigaProyecto(updatedEquipo.taigaProyecto);
    } catch (error) {
      setError('Error al confirmar el proyecto.');
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      await disconnectOrganizacion(equipo.id, token);
      setShowDisconnectPopup(false);
      setEquipo((prev) => ({ ...prev, gitOrganizacion: null }));
      alert('Organització de GitHub desconnectada correctament.');
    } catch (error) {
      alert('Error al desconnectar la organització.');
    }
  };

  const handleConfirmDisconnectTaiga = async () => {
    try {
      await disconnectProyecto(equipo.id, token);
      setShowDisconnectPopupTaiga(false);
      setEquipo((prev) => ({ ...prev, taigaProyecto: null }));
      alert('Projecte de Taiga desconnectat correctament.');
      setTaigaUrl('');
      setValidationResultsT(null);
      setComprobandoValidacionT(false);
    } catch (error) {
      alert('Error al desconnectar el projecte.');
    }
  };

  const handleBackClick = () => {
    if (localStorage.getItem('rol') === 'Profesor') {
      navigate(`/cursos/${equipo.cursoId}`);
    } else {
      navigate('/equipos');
    }
  };

  const handlePopupConfirm = async () => {
    try {
      if (popupAction === 'borrar') {
        await borrarEquipo(id, token);
      } else if (popupAction === 'salir') {
        await salirEquipo(id, idEstudiante, token);
      }
      if (!isProfesor) navigate('/equipos');
      else navigate(`/cursos/${equipo.cursoId}`);
    } catch (error) {
      setError('Error al realizar la acción.');
    } finally {
      setShowPopup(false);
    }
  };

  const handlePopupCancel = () => {
    setShowPopup(false);
  };

  const handleEditToggle = async () => {
    if (!isEditing) {
      try {
        const estudiantesData = await getEstudiantesCurso(
          equipo.cursoId,
          token,
        );
        setEstudiantesSinEquipo(estudiantesData.sinEquipo || []);
      } catch (error) {
        console.error('Error al cargar estudiantes sin equipo:', error);
      }
    }
    setIsEditing(!isEditing);
    setMiembrosAEliminar([]);
    setMiembrosAAgregar([]);
    setMiembrosSeleccionados([]);
  };

  const handleAddMember = (estudianteId) => {
    if (miembrosSeleccionados.includes(estudianteId)) {
      setMiembrosAAgregar((prev) => prev.filter((id) => id !== estudianteId));
      setMiembrosSeleccionados((prev) =>
        prev.filter((id) => id !== estudianteId),
      );
    } else {
      setMiembrosAAgregar((prev) => [...prev, estudianteId]);
      setMiembrosSeleccionados((prev) => [...prev, estudianteId]);
    }
  };

  const handleRemoveMember = (estudianteId) => {
    if (miembrosSeleccionados.includes(estudianteId)) {
      setMiembrosAEliminar((prev) => prev.filter((id) => id !== estudianteId));
      setMiembrosSeleccionados((prev) =>
        prev.filter((id) => id !== estudianteId),
      );
    } else {
      setMiembrosAEliminar((prev) => [...prev, estudianteId]);
      setMiembrosSeleccionados((prev) => [...prev, estudianteId]);
    }
  };

  const handleSaveChanges = () => {
    setShowConfirmChangesPopup(true);
  };

  const handleConfirmChanges = async () => {
    try {
      if (miembrosAEliminar.length > 0) {
        await borrarMiembros(
          equipo.id,
          { estudiantesIds: miembrosAEliminar },
          token,
        );
      }
      if (miembrosAAgregar.length > 0) {
        await añadirMiembros(
          equipo.id,
          { estudiantesIds: miembrosAAgregar },
          token,
        );
      }

      setMiembrosAEliminar([]);
      setMiembrosAAgregar([]);
      setMiembrosSeleccionados([]);
      setIsEditing(false);

      const equipoData = await getEquipoDetalle(id, token);
      setEquipo(equipoData);
    } catch (error) {
      setError('Error al guardar los cambios.');
    } finally {
      setShowConfirmChangesPopup(false);
    }
  };

  if (loading)
    return (
      <div className="loading-state">Carregant detalls de l&apos;equip...</div>
    );

  if (!equipo)
    return (
      <div className="loading-state">
        No s&apos;ha trobat la informació de l&apos;equip.
      </div>
    );

  if (!equipo.activo) {
    return (
      <div className="equipo-page">
        <Sidebar />
        <div className="equipo-content inactive-state-container">
          <div className="modern-card inactive-popup">
            <h2>El curs al qual pertany aquest equip ja no està disponible.</h2>
            <p className="text-muted">
              No pots accedir a les dades d&apos;un equip inactiu.
            </p>
            <button className="btn-primary" onClick={handleBackClick}>
              ← Torna enrere
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="equipo-page">
      <Sidebar />
      <div className="equipo-content">
        {/* --- CABECERA MODERNIZADA --- */}
        <div className="page-header">
          <div className="header-left">
            <button className="btn-back" onClick={handleBackClick}>
              ← Torna enrere
            </button>
            <h1 className="equipo-title">{equipo.nombre}</h1>
            <div className="equipo-subtitle">
              <span className="badge badge-curso">
                {equipo.nombreAsignatura} ({equipo.añoInicio})
              </span>
              <span className="badge badge-quadrimestre">
                {equipo.cuatrimestre === 1
                  ? 'Q1 - Tardor'
                  : equipo.cuatrimestre === 2
                    ? 'Q2 - Primavera'
                    : 'Desconegut'}
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-danger"
              onClick={() => {
                setPopupAction('borrar');
                setShowPopup(true);
              }}
            >
              Esborrar equip
            </button>
            {!isProfesor && (
              <button
                className="btn-warning"
                onClick={() => {
                  setPopupAction('salir');
                  setShowPopup(true);
                }}
              >
                Sortir d&apos;aquest equip
              </button>
            )}
          </div>
        </div>

        {/* --- PANEL DE MÉTRICAS (PROFESOR) --- */}
        {isProfesor && (
          <div className="modern-card metrics-card">
            <h2>Mètriques i Avaluacions</h2>
            <div className="metrics-grid">
              {/* MÉTRICAS DE CÓDIGO GENERALES (GITHUB) */}
              {equipo.gitOrganizacion ? (
                <>
                  <Link
                    to={`/equipo/${id}/datos_generales?org=${equipo.gitOrganizacion}&estudiantesIds=${estIds.join(',')}`}
                    className="metric-box"
                  >
                    <span className="icon">📊</span>
                    <div className="metric-text">
                      <h3>Dades Generals</h3>
                      <p>Resum general de l&apos;equip</p>
                    </div>
                  </Link>
                  <Link
                    to={`/equipo/${equipo.id}/datos_historicos`}
                    className="metric-box"
                  >
                    <span className="icon">📈</span>
                    <div className="metric-text">
                      <h3>Historial</h3>
                      <p>Historial de dades de l&apos;equip</p>
                    </div>
                  </Link>
                  <Link
                    to={`/equipo/${id}/metrics?org=${equipo.gitOrganizacion}&estudiantesIds=${estIds.join(',')}`}
                    className="metric-box"
                  >
                    <span className="icon">💻</span>
                    <div className="metric-text">
                      <h3>Codi (GitHub)</h3>
                      <p>Detalls de les mètriques de codi</p>
                    </div>
                  </Link>
                </>
              ) : (
                <div className="metric-box disabled">
                  <span className="icon">⚠️</span>
                  <div className="metric-text">
                    <h3>Mètriques de Codi Inactives</h3>
                    <p>
                      L&apos;equip no ha configurat l&apos;organització de
                      GitHub.
                    </p>
                  </div>
                </div>
              )}

              {/* GESTIÓN DE TAREAS: GITHUB */}
              {equipo.gestionTareas === 'GitHub' &&
                (equipo.gitOrganizacion ? (
                  <Link
                    to={`/equipo/${id}/github-metrics?org=${equipo.gitOrganizacion}&estudiantesIds=${estIds.join(',')}`}
                    className="metric-box"
                  >
                    <span className="icon">📋</span>
                    <div className="metric-text">
                      <h3>Tasques (GitHub)</h3>
                      <p>Gestió de tasques via GitHub</p>
                    </div>
                  </Link>
                ) : (
                  <div className="metric-box disabled">
                    <span className="icon">⚠️</span>
                    <div className="metric-text">
                      <h3> Mètriques de Tasques Inactives (GitHub) </h3>
                      <p>
                        L&apos;equip no ha configurat l&apos;organització de
                        GitHub.
                      </p>
                    </div>
                  </div>
                ))}

              {/* GESTIÓN DE TAREAS: TAIGA */}
              {equipo.gestionTareas === 'Taiga' &&
                (equipo.taigaProyecto ? (
                  <Link
                    to={`/equipo/${id}/taiga-metrics?project=${equipo.taigaProyecto}`}
                    className="metric-box"
                  >
                    <span className="icon">🎯</span>
                    <div className="metric-text">
                      <h3>Tasques (Taiga)</h3>
                      <p>Gestió de tasques via Taiga</p>
                    </div>
                  </Link>
                ) : (
                  <div className="metric-box disabled">
                    <span className="icon">⚠️</span>
                    <div className="metric-text">
                      <h3>Mètriques de Tasques Inactives (Taiga)</h3>
                      <p>L&apos;equip no ha configurat el projecte de Taiga.</p>
                    </div>
                  </div>
                ))}

              {/* AVALUACIONES */}
              <Link
                to={`/equipo/${id}/evaluaciones_generales`}
                className="metric-box highlight"
              >
                <span className="icon">📝</span>
                <div className="metric-text">
                  <h3>Avaluacions</h3>
                  <p>Detalls de les dades d&apos;avaluacions</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* --- PANEL DE EVALUACIÓN (ESTUDIANTE) --- */}
        {!isProfesor && (
          <div className="modern-card">
            <h2>Avaluacions</h2>
            <div className="evaluacion-estudiante-container">
              {evaluacionActiva?.activa && !evaluacionRealizada ? (
                <div className="evaluacion-banner active">
                  <div className="eval-info">
                    <h3>Avalua als teus companys</h3>
                    <p>
                      Tens fins el{' '}
                      <strong>
                        {evaluacionActiva.fechaFin
                          ? format(
                              new Date(evaluacionActiva.fechaFin),
                              "d 'de' MMMM 'de' yyyy",
                              { locale: ca },
                            )
                          : ''}
                      </strong>{' '}
                      per fer-ho.
                    </p>
                  </div>
                  <Link
                    to={`/equipo/${equipo.id}/evaluacion`}
                    className="btn-primary"
                  >
                    Començar Avaluació
                  </Link>
                </div>
              ) : (
                <p className="text-muted">
                  No hi ha avaluacions pendents actives en aquest moment.
                </p>
              )}

              <div className="my-evaluations-link">
                <Link
                  to={`/equipo/${equipo.id}/les_meves_avaluacions`}
                  className="btn-secondary"
                >
                  📝 Veure la meva autoavaluació
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- CONFIGURACIÓN GITHUB --- */}
        <div className="modern-card">
          <h2>Organització de GitHub</h2>
          {isProfesor ? (
            equipo.gitOrganizacion ? (
              <p className="status-success">
                ✅ Configuració activa:{' '}
                <a
                  href={`https://github.com/${equipo.gitOrganizacion}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {equipo.gitOrganizacion}
                </a>
              </p>
            ) : (
              <p className="text-muted">
                Els estudiants encara no han definit la seva organització de
                GitHub.
              </p>
            )
          ) : (
            <>
              {equipo.gitOrganizacion ? (
                <div className="config-success-box">
                  <p>
                    ✅ Organització activa:{' '}
                    <a
                      href={`https://github.com/${equipo.gitOrganizacion}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {equipo.gitOrganizacion}
                    </a>
                  </p>
                  <button
                    className="btn-danger btn-small"
                    onClick={() => setShowDisconnectPopup(true)}
                  >
                    Desconnectar
                  </button>
                </div>
              ) : (
                <div className="config-setup-box">
                  {!comprobandoValidacion ? (
                    <>
                      <p className="config-instructions">
                        Introdueix la URL de l&apos;organització. El perfil{' '}
                        <strong>{equipo.githubAsignatura}</strong> n&apos;ha de
                        ser membre amb permisos d&apos;<strong>Owner</strong>.
                      </p>
                      <div className="input-group">
                        <input
                          type="text"
                          placeholder="https://github.com/organitzacio"
                          value={gitOrgUrl}
                          onChange={(e) => setGitOrgUrl(e.target.value)}
                          className="form-input"
                        />
                        <button
                          onClick={handleValidateGitOrg}
                          className="btn-primary"
                          disabled={!gitOrgUrl}
                        >
                          Validar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="validation-results">
                      <ul className="checklist">
                        <li>
                          {validationResults?.professoratEsMiembro
                            ? '✅'
                            : '❌'}{' '}
                          L&apos;usuari {equipo.githubAsignatura} és membre.
                        </li>
                        <li>
                          {validationResults?.professoratEsAdmin ? '✅' : '❌'}{' '}
                          L&apos;usuari {equipo.githubAsignatura} té permisos
                          d&apos;owner.
                        </li>
                        <li>
                          {validationResults?.todosUsuariosGitConfigurados
                            ? '✅'
                            : '❌'}{' '}
                          Tots els membres tenen compte de GitHub.
                        </li>
                        <li>
                          {validationResults?.todosMiembrosEnOrganizacion
                            ? '✅'
                            : '❌'}{' '}
                          Tots els membres pertanyen a l&apos;organització.
                        </li>
                        <li>
                          {validationResults?.profesorEnOrganizacion
                            ? '✅'
                            : '❌'}{' '}
                          El professor pertany a l&apos;organització.
                        </li>
                      </ul>

                      <div className="validation-actions">
                        {validationResults?.professoratEsMiembro &&
                        validationResults?.professoratEsAdmin &&
                        validationResults?.todosUsuariosGitConfigurados &&
                        validationResults?.todosMiembrosEnOrganizacion &&
                        validationResults?.profesorEnOrganizacion ? (
                          <button
                            onClick={handleConfirmGitOrg}
                            className="btn-success"
                          >
                            Confirmar organització
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleValidateGitOrg}
                              className="btn-primary"
                            >
                              Torna a validar
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setComprobandoValidacion(false)}
                            >
                              Torna enrere
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* --- CONFIGURACIÓN TAIGA --- */}
        {equipo.gestionTareas === 'Taiga' && (
          <div className="modern-card">
            <h2>Projecte de Taiga</h2>
            {isProfesor ? (
              equipo.taigaProyecto ? (
                <p className="status-success">
                  ✅ Projecte actiu:{' '}
                  <a
                    href={`https://taiga.com/${equipo.taigaProyecto}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {equipo.taigaProyecto}
                  </a>
                </p>
              ) : (
                <p className="text-muted">
                  Els estudiants encara no han definit el seu projecte de Taiga.
                </p>
              )
            ) : (
              <>
                {equipo.taigaProyecto ? (
                  <div className="config-success-box">
                    <p>
                      ✅ Projecte actiu:{' '}
                      <a
                        href={`https://taiga.com/${equipo.taigaProyecto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {equipo.taigaProyecto}
                      </a>
                    </p>
                    <button
                      className="btn-danger btn-small"
                      onClick={() => setShowDisconnectPopupTaiga(true)}
                    >
                      Desconnectar
                    </button>
                  </div>
                ) : (
                  <div className="config-setup-box">
                    {!comprobandoValidacionT ? (
                      <>
                        {error && <div className="error-banner">{error}</div>}
                        <p className="config-instructions">
                          Introdueix la URL del projecte públic. El perfil{' '}
                          <strong>{equipo.taigaUserProf}</strong> n&apos;ha de
                          ser membre.
                        </p>
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="https://taiga.com/project/nom-projecte"
                            value={TaigaUrl}
                            onChange={(e) => setTaigaUrl(e.target.value)}
                            className="form-input"
                          />
                          <button
                            onClick={handleValidateTaiga}
                            className="btn-primary"
                            disabled={!TaigaUrl}
                          >
                            Validar
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="validation-results">
                        <ul className="checklist">
                          <li>
                            {validationResultsT?.professoratEsMiembroT
                              ? '✅'
                              : '❌'}{' '}
                            L&apos;usuari {equipo.taigaUserProf} és membre.
                          </li>
                          <li>
                            {validationResultsT?.todosUsuariosTaigaConfigurados
                              ? '✅'
                              : '❌'}{' '}
                            Tots els membres tenen compte de Taiga.
                          </li>
                          <li>
                            {validationResultsT?.todosMiembrosEnProyecto
                              ? '✅'
                              : '❌'}{' '}
                            Tots els membres pertanyen al projecte.
                          </li>
                          <li>
                            {validationResultsT?.proyectoPublico ? '✅' : '❌'}{' '}
                            El projecte és públic.
                          </li>
                        </ul>
                        <div className="validation-actions">
                          {validationResultsT?.professoratEsMiembroT &&
                          validationResultsT?.todosUsuariosTaigaConfigurados &&
                          validationResultsT?.todosMiembrosEnProyecto &&
                          validationResultsT?.proyectoPublico ? (
                            <button
                              onClick={handleConfirmTaiga}
                              className="btn-success"
                            >
                              Confirmar projecte
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleValidateTaiga}
                                className="btn-primary"
                              >
                                Torna a validar
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => setComprobandoValidacionT(false)}
                              >
                                Torna enrere
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- MIEMBROS DEL EQUIPO --- */}
        <div className="modern-card">
          <div className="section-header">
            <h2>Membres de l&apos;equip</h2>
            {!isEditing && (
              <button
                className="btn-secondary btn-small"
                onClick={handleEditToggle}
              >
                Modificar membres
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="edit-members-layout">
              <div className="members-column">
                <h3>Equip Actual</h3>
                <div className="student-list-box">
                  {equipo.estudiantes.map((miembro) => (
                    <div key={miembro.id} className="student-row">
                      <span>{miembro.nombre}</span>
                      <button
                        className={`action-icon remove ${miembrosSeleccionados.includes(miembro.id) ? 'selected' : ''}`}
                        onClick={() => handleRemoveMember(miembro.id)}
                        aria-label="Eliminar membre"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="members-column">
                <h3>Estudiants sense equip</h3>
                <input
                  type="text"
                  placeholder="Cerca un estudiant..."
                  className="form-input mb-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="student-list-box scrollable">
                  {filteredEstudiantesSinEquipo.length > 0 ? (
                    filteredEstudiantesSinEquipo.map((estudiante) => (
                      <div key={estudiante.id} className="student-row">
                        <span>{estudiante.nombre}</span>
                        <button
                          className={`action-icon add ${miembrosSeleccionados.includes(estudiante.id) ? 'selected' : ''}`}
                          onClick={() => handleAddMember(estudiante.id)}
                          aria-label="Afegir membre"
                        >
                          ➕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small">
                      No hi ha estudiants disponibles.
                    </p>
                  )}
                </div>
              </div>

              <div className="edit-actions-footer">
                <button className="btn-secondary" onClick={handleEditToggle}>
                  Cancel·lar
                </button>
                <button className="btn-primary" onClick={handleSaveChanges}>
                  Desar Canvis
                </button>
              </div>
            </div>
          ) : (
            <div className="members-avatar-grid">
              {equipo.estudiantes.map((estudiante, index) => (
                <div key={estudiante.id} className="member-avatar">
                  <div
                    className="avatar-circle"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {estudiante.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="avatar-name">{estudiante.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- POPUPS --- */}
        {(showPopup ||
          showConfirmChangesPopup ||
          showDisconnectPopup ||
          showDisconnectPopupTaiga) && (
          <div className="popup-overlay">
            <div className="popup-modern">
              {showPopup && (
                <>
                  <h3>
                    {popupAction === 'borrar'
                      ? 'Esborrar equip'
                      : "Sortir de l'equip"}
                  </h3>
                  <p>
                    Estàs segur/a que vols{' '}
                    {popupAction === 'borrar'
                      ? 'esborrar aquest equip'
                      : "sortir d'aquest equip"}
                    ?
                  </p>
                  <p className="text-danger small">
                    Aquesta acció no es pot desfer i es perdrà la informació.
                  </p>
                  <div className="popup-actions">
                    <button
                      className="btn-secondary"
                      onClick={handlePopupCancel}
                    >
                      Cancel·lar
                    </button>
                    <button className="btn-danger" onClick={handlePopupConfirm}>
                      Confirmar
                    </button>
                  </div>
                </>
              )}

              {showConfirmChangesPopup && (
                <>
                  <h3>Guardar Canvis</h3>
                  <p>
                    Estàs segur/a que vols fer aquestes modificacions als
                    membres de l&apos;equip?
                  </p>
                  {miembrosAEliminar.length === equipo.estudiantes.length &&
                    miembrosAAgregar.length === 0 && (
                      <p className="text-danger small">
                        No pots eliminar a tots els membres sense afegir-ne cap.
                      </p>
                    )}
                  <div className="popup-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => setShowConfirmChangesPopup(false)}
                    >
                      Cancel·lar
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleConfirmChanges}
                      disabled={
                        miembrosAEliminar.length ===
                          equipo.estudiantes.length &&
                        miembrosAAgregar.length === 0
                      }
                    >
                      Desar canvis
                    </button>
                  </div>
                </>
              )}

              {showDisconnectPopup && (
                <>
                  <h3>Desconnectar Organització</h3>
                  <p>
                    Estàs segur/a que vols desconnectar aquesta organització de
                    GitHub?
                  </p>
                  <div className="popup-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => setShowDisconnectPopup(false)}
                    >
                      Cancel·lar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={handleConfirmDisconnect}
                    >
                      Desconnectar
                    </button>
                  </div>
                </>
              )}

              {showDisconnectPopupTaiga && (
                <>
                  <h3>Desconnectar Projecte</h3>
                  <p>
                    Segur que vols desvincular aquest projecte de Taiga de
                    l&apos;equip?
                  </p>
                  <div className="popup-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => setShowDisconnectPopupTaiga(false)}
                    >
                      Cancel·lar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={handleConfirmDisconnectTaiga}
                    >
                      Desconnectar
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

export default EquipoPage;
