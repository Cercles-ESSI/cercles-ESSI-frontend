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
  '#A8DADH',
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
        console.log('data ', equipoData);

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
          console.log('Evaluación activa:', evaluacionData);
          const evaluacionId = await getEvaluacionActivaId(equipo.id, token);
          const realizada = await isEvaluacionRealizada(
            idEstudiante,
            evaluacionId,
            token,
          );
          console.log('Evaluación activa:', evaluacionData);
          console.log('Evaluación realizada:', realizada);

          setEvaluacionActiva(evaluacionData);
          setEvaluacionRealizada(realizada);
        }
      } catch (error) {
        console.error('Error al comprobar el estado de la evaluación:', error);
      }
    };

    fetchEvaluacionStatus();
  }, [equipo]);

  // Validar la organización
  const handleValidateGitOrg = async () => {
    try {
      setComprobandoValidacion(true); // Activar la validación
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

  // Confirmar la organización si todos los checks son correctos
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

  // Validar proyecto
  const handleValidateTaiga = async () => {
    try {
      setComprobandoValidacionT(true); // Activar la validación
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
      //setComprobandoValidacionT(false);
    }
  };

  // Confirmar el proyecto si todos los checks son correctos
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

  //desconectar org
  const handleConfirmDisconnect = async () => {
    try {
      await disconnectOrganizacion(equipo.id, token);
      setShowDisconnectPopup(false);
      setEquipo((prev) => ({ ...prev, gitOrganizacion: null }));
      alert('Organització de GitHub desconnectada correctament.');
    } catch (error) {
      console.error('Error al desconnectar la organització:', error);
      alert('Error al desconnectar la organització.');
    }
  };

  //desconectar prj
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
      console.error('Error al desconnectar el projecte:', error);
      alert('Error al desconnectar el projecte.');
    }
  };

  const handleBackClick = () => {
    if (localStorage.getItem('rol') === 'Profesor') {
      console.log('si');
      navigate(`/cursos/${equipo.cursoId}`);
    } else {
      console.log('no');
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
      // Si ya está seleccionado, deseleccionarlo
      setMiembrosAAgregar((prev) => prev.filter((id) => id !== estudianteId));
      setMiembrosSeleccionados((prev) =>
        prev.filter((id) => id !== estudianteId),
      );
    } else {
      // Si no está seleccionado, añadirlo
      setMiembrosAAgregar((prev) => [...prev, estudianteId]);
      setMiembrosSeleccionados((prev) => [...prev, estudianteId]);
    }
  };

  const handleRemoveMember = (estudianteId) => {
    if (miembrosSeleccionados.includes(estudianteId)) {
      // Si ya está seleccionado, deseleccionarlo
      setMiembrosAEliminar((prev) => prev.filter((id) => id !== estudianteId));
      setMiembrosSeleccionados((prev) =>
        prev.filter((id) => id !== estudianteId),
      );
    } else {
      // Si no está seleccionado, añadirlo
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
      console.error(error);
    } finally {
      setShowConfirmChangesPopup(false);
    }
  };

  if (loading) {
    return <div>Carregant detalls de l&apos;equip...</div>;
  }

  //if (error) {
  //  return <div className="error-message">{error}</div>;
  //}

  if (!equipo) {
    return <div>No s&apos;ha trobat la informació de l&apos;equip.</div>;
  }

  if (!equipo.activo) {
    return (
      <div className="inactive-overlay">
        <Sidebar />
        <div className="inactive-popup">
          <h2>Els curs al que pertany aquest equip ja no està disponible.</h2>
          <button className="equipos-back-button" onClick={handleBackClick}>
            Torna enrere
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="equipo-page">
      <Sidebar />
      <div className="equipo-content">
        <button className="equipos-back-button" onClick={handleBackClick}>
          Torna enrere
        </button>
        <h1 className="equipo-title">{equipo.nombre}</h1>

        <div className="action-buttons">
          <button
            className="delete-button"
            onClick={() => {
              setPopupAction('borrar');
              setShowPopup(true);
            }}
          >
            Esborrar equip
          </button>
          {!isProfesor && (
            <button
              className="leave-button"
              onClick={() => {
                setPopupAction('salir');
                setShowPopup(true);
              }}
            >
              Sortir d&apos;aquest equip
            </button>
          )}
        </div>

        <div className="equipo-info">
          <div className="equipo-info-content">
            <p>
              <strong>Curs:</strong> {equipo.nombreAsignatura} (
              {equipo.añoInicio})
            </p>
            <p>
              <strong>Quadrimestre:</strong>{' '}
              {equipo.cuatrimestre === 1
                ? 'Tardor'
                : equipo.cuatrimestre === 2
                  ? 'Primavera'
                  : 'Desconegut'}
            </p>
          </div>
        </div>
        <div className="equipo-section">
          {isProfesor ? (
            <>
              <div className="metrics-links-container">
                {/* Link a métricas de GitHub */}
                {equipo.gitOrganizacion ? (
                  <>
                    <Link
                      to={`/equipo/${id}/datos_generales?org=${equipo.gitOrganizacion}&estudiantesIds=${estIds.join(',')}`}
                      className="metrics-link"
                    >
                      📊 DADES GENERALS DE L&apos;EQUIP
                    </Link>

                    <Link
                      to={`/equipo/${equipo.id}/datos_historicos`}
                      className="metrics-link"
                    >
                      📊 HISTORIAL DE DADES DE L&apos;EQUIP
                    </Link>

                    <Link
                      to={`/equipo/${id}/metrics?org=${equipo.gitOrganizacion}&estudiantesIds=${estIds.join(',')}`}
                      className="metrics-link"
                    >
                      📊 Veure detalls de les mètriques de GitHub
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="metrics-link-disabled">
                      📊 DADES GENERALS DE L&apos;EQUIP
                      <span className="disabled-message">
                        Aquest equip encara no ha configurat la seva
                        organització de Github, per tant no pots veure les dades
                        generals de l&apos;equip.
                      </span>
                    </div>
                    <div className="metrics-link-disabled">
                      📊 Veure detalls de les mètriques de codi
                      <span className="disabled-message">
                        Aquest equip encara no ha configurat la seva
                        organització de Github, per tant no hi ha dades a veure.
                      </span>
                    </div>
                  </>
                )}

                {/* Bloque para GITHUB */}
                {equipo.gestionTareas === 'GitHub' &&
                  (equipo.gitOrganizacion ? (
                    <Link
                      to={`/equipo/${id}/github-metrics?org=${equipo.gitOrganizacion}&estudiantesIds=${estIds.join(',')}`}
                      className="metrics-link"
                    >
                      📊 Veure mètriques de gestió de tasques (GitHub)
                    </Link>
                  ) : (
                    <div className="metrics-link-disabled">
                      📊 Veure mètriques de gestió de tasques (GitHub)
                      <span className="disabled-message">
                        Aquest equip encara no ha configurat la seva
                        organització de GitHub, per tant no hi ha dades a veure.
                      </span>
                    </div>
                  ))}

                {/* Bloque para TAIGA */}
                {equipo.gestionTareas === 'Taiga' &&
                  (equipo.taigaProyecto ? (
                    <Link
                      to={`/equipo/${id}/taiga-metrics?project=${equipo.taigaProyecto}`}
                      className="metrics-link"
                    >
                      📊 Veure mètriques de gestió de tasques (Taiga)
                    </Link>
                  ) : (
                    <div className="metrics-link-disabled">
                      📊 Veure mètriques de gestió de tasques (Taiga)
                      <span className="disabled-message">
                        Aquest equip encara no ha configurat el seu projecte de
                        Taiga, per tant no hi ha dades a veure.
                      </span>
                    </div>
                  ))}
                {/* Link a dades d'avaluacions */}
                <Link
                  to={`/equipo/${id}/evaluaciones_generales`}
                  className="metrics-link"
                >
                  📊 Veure detalls de les dades d&apos;avaluacions
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Link de evaluación para estudiantes */}
              {evaluacionActiva?.activa && !evaluacionRealizada ? (
                <div className="evaluacion-container">
                  <Link
                    to={`/equipo/${equipo.id}/evaluacion`}
                    className="evaluacion-link"
                  >
                    Avalua als teus companys
                  </Link>
                  <p className="evaluacion-info">
                    Tens fins el{' '}
                    <strong>
                      {evaluacionActiva.fechaFin
                        ? format(
                            new Date(evaluacionActiva.fechaFin),
                            "d 'de' MMMM 'de' yyyy",
                            {
                              locale: ca,
                            },
                          )
                        : ''}
                    </strong>{' '}
                    per fer aquesta avaluació al teu equip.
                  </p>
                </div>
              ) : (
                <span className="evaluacion-link-disabled">
                  No hi ha avaluacions actives
                </span>
              )}
            </>
          )}
        </div>

        {!isProfesor && (
          <div className="equipo-section">
            <Link
              to={`/equipo/${equipo.id}/les_meves_avaluacions`}
              className="metrics-link"
            >
              📝 Veure la meva autoavaluació
            </Link>
          </div>
        )}

        {/* Organización GitHub */}
        <div className="equipo-section">
          <h2>Organització de GitHub</h2>

          {isProfesor ? (
            equipo.gitOrganizacion ? (
              <>
                <p>
                  ✅ L&apos;organització de GitHub està configurada:
                  <a
                    href={`https://github.com/${equipo.gitOrganizacion}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-org-link"
                  >
                    {equipo.gitOrganizacion}
                  </a>
                </p>
              </>
            ) : (
              <p>
                Els estudiants encara no han definit la seva organització de
                GitHub.
              </p>
            )
          ) : (
            // Vista para estudiantes
            <>
              {equipo.gitOrganizacion ? (
                // organización ya está configurada
                <>
                  <p>
                    ✅ L&apos;organització de GitHub està configurada:
                    <a
                      href={`https://github.com/${equipo.gitOrganizacion}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-org-link"
                    >
                      {equipo.gitOrganizacion}
                    </a>
                    <button
                      className="disconnect-button"
                      onClick={() => setShowDisconnectPopup(true)}
                    >
                      Desconnectar organització
                    </button>
                  </p>
                </>
              ) : (
                // Si la organización aún no está configurada
                <>
                  {!comprobandoValidacion ? (
                    <>
                      <p>
                        Introdueix la URL de l&apos;organització de GitHub del
                        teu equip. Assegura&apos;t de que el perfil de
                        <strong> {equipo.githubAsignatura}</strong> n&apos;és
                        membre i que té permisos d&apos;<strong>Owner</strong>.
                      </p>
                      <input
                        type="text"
                        placeholder="https://github.com/organització"
                        value={gitOrgUrl}
                        onChange={(e) => setGitOrgUrl(e.target.value)}
                        className="git-org-input-field"
                      />
                      <button
                        onClick={handleValidateGitOrg}
                        className="validate-git-org-button"
                        disabled={!gitOrgUrl}
                      >
                        Validar
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Checklist de validación */}
                      <div className="validation-results">
                        <p>
                          {validationResults?.professoratEsMiembro ? (
                            <>
                              ✅ L&apos;usuari{' '}
                              <strong>{equipo.githubAsignatura}</strong> és
                              membre de l&apos;organització.
                            </>
                          ) : (
                            <>
                              ❌ L&apos;usuari{' '}
                              <strong>{equipo.githubAsignatura}</strong> no és
                              membre de l&apos;organització.
                            </>
                          )}
                        </p>

                        <p>
                          {validationResults?.professoratEsAdmin ? (
                            <>
                              ✅ L&apos;usuari{' '}
                              <strong>{equipo.githubAsignatura}</strong> té
                              permisos d&apos;owner en l&apos;organització.
                            </>
                          ) : (
                            <>
                              ❌ L&apos;usuari{' '}
                              <strong>{equipo.githubAsignatura}</strong> no té
                              permisos d&apos;owner en l&apos;organització.
                            </>
                          )}
                        </p>

                        <p>
                          {validationResults?.todosUsuariosGitConfigurados
                            ? '✅ Tots els membres tenen un compte de GitHub associat.'
                            : '❌ No tots els membres tenen un compte de GitHub associat.'}
                        </p>
                        <p>
                          {validationResults?.todosMiembrosEnOrganizacion
                            ? "✅ Tots els membres pertanyen a l'organització."
                            : "❌ No tots els membres pertanyen a l'organització."}
                        </p>
                        <p>
                          {validationResults?.profesorEnOrganizacion
                            ? "✅ El professor pertany a l'organització."
                            : "❌ El professor no pertany a l'organització."}
                        </p>
                        {/* Botón para reintroducir la organización si hay problemas */}
                        {validationResults?.professoratEsMiembro &&
                        validationResults?.professoratEsAdmin &&
                        validationResults?.todosUsuariosGitConfigurados &&
                        validationResults?.todosMiembrosEnOrganizacion &&
                        validationResults?.profesorEnOrganizacion ? (
                          <button
                            onClick={async () => {
                              try {
                                await handleConfirmGitOrg();
                                alert(
                                  "L'organització s'ha confirmat correctament! Actualitzant vista...",
                                );
                              } catch (error) {
                                setError(
                                  "Hi ha hagut un error al confirmar l'organització.",
                                );
                              }
                            }}
                            className="confirm-git-org-button"
                          >
                            Confirmar organització
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleValidateGitOrg}
                              className="validate-git-org-button"
                            >
                              Torna a validar l&apos;organització de GitHub
                            </button>
                            <button
                              className="error-message-button"
                              onClick={() => setComprobandoValidacion(false)}
                            >
                              Torna enrere
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {equipo.gestionTareas === 'Taiga' && (
          <div className="equipo-section">
            <h2>Projecte de Taiga</h2>
            {isProfesor ? (
              equipo.taigaProyecto ? (
                <>
                  <p>
                    ✅ El projecte de Taiga està configurat:
                    <a
                      href={`https://taiga.com/${equipo.taigaProyecto}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-org-link"
                    >
                      {equipo.taigaProyecto}
                    </a>
                  </p>
                </>
              ) : (
                <p>
                  Els estudiants encara no han definit el seu projecte de Taiga.
                </p>
              )
            ) : (
              // Vista para estudiantes
              <>
                {equipo.taigaProyecto ? (
                  // organización ya está configurada
                  <>
                    <p>
                      ✅ El projecte de Taiga està configurat:
                      <a
                        href={`https://taiga.com/${equipo.taigaProyecto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-org-link"
                      >
                        {equipo.taigaProyecto}
                      </a>
                      <button
                        className="disconnect-button"
                        onClick={() => setShowDisconnectPopupTaiga(true)}
                      >
                        Desconnectar projecte
                      </button>
                    </p>
                  </>
                ) : (
                  // Si la organización aún no está configurada
                  <>
                    {!comprobandoValidacionT ? (
                      <>
                        {error && (
                          <div className="error-message-inline">{error}</div>
                        )}
                        <p>
                          Introdueix la URL del projecte de Taiga del teu equip.
                          Assegura&apos;t de que el perfil del professor
                          <strong> {equipo.taigaUserProf}</strong> n&apos;és
                          membre i que el projecte es <strong>públic</strong>.
                        </p>
                        <input
                          type="text"
                          placeholder="https://taiga.com/project/nom-projecte"
                          value={TaigaUrl}
                          onChange={(e) => setTaigaUrl(e.target.value)}
                          className="git-org-input-field"
                        />
                        <button
                          onClick={handleValidateTaiga}
                          className="validate-git-org-button"
                          disabled={!TaigaUrl}
                        >
                          Validar
                        </button>
                      </>
                    ) : (
                      <div className="validation-results">
                        <p>
                          {validationResultsT?.professoratEsMiembroT ? (
                            <>
                              ✅ L&apos;usuari{' '}
                              <strong>{equipo.taigaUserProf} </strong>
                              és membre del projecte.
                            </>
                          ) : (
                            <>
                              ❌ L&apos;usuari{' '}
                              <strong>{equipo.taigaUserProf} </strong>
                              no és membre del projecte.
                            </>
                          )}
                        </p>

                        <p>
                          {validationResultsT?.todosUsuariosTaigaConfigurados
                            ? '✅ Tots els membres tenen un compte de Taiga associat.'
                            : '❌ No tots els membres tenen un compte de Taiga associat.'}
                        </p>
                        <p>
                          {validationResultsT?.todosMiembrosEnProyecto
                            ? '✅ Tots els membres pertanyen al projecte de Taiga.'
                            : '❌ No tots els membres pertanyen al projecte de Taiga.'}
                        </p>
                        <p>
                          {validationResultsT?.proyectoPublico
                            ? '✅ El projecte és públic.'
                            : '❌ El projecte és privat.'}
                        </p>
                        {validationResultsT?.professoratEsMiembroT &&
                        validationResultsT?.todosUsuariosTaigaConfigurados &&
                        validationResultsT?.todosMiembrosEnProyecto &&
                        validationResultsT?.proyectoPublico ? (
                          <button
                            onClick={async () => {
                              try {
                                await handleConfirmTaiga();
                                alert('Confirmat!');
                              } catch (error) {
                                setError('Error.');
                              }
                            }}
                            className="confirm-git-org-button"
                          >
                            Confirmar organització
                          </button>
                        ) : (
                          <>
                            {error && (
                              <div className="error-message-inline">
                                {error}
                              </div>
                            )}
                            <button
                              onClick={handleValidateTaiga}
                              className="validate-git-org-button"
                            >
                              Torna a validar
                            </button>
                            <button
                              className="error-message-button"
                              onClick={() => setComprobandoValidacionT(false)}
                            >
                              Torna enrere
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        <div className="equipo-section">
          <h2>Membres de l&apos;equip</h2>
          {isEditing ? (
            <>
              <div className="edit-members">
                <div className="students-list">
                  {equipo.estudiantes.map((miembro) => (
                    <div key={miembro.id} className="student-item">
                      <span>{miembro.nombre}</span>
                      <button
                        className={`remove-member-button ${
                          miembrosSeleccionados.includes(miembro.id)
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => handleRemoveMember(miembro.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <h2>Estudiants sense equip</h2>

                <input
                  type="text"
                  placeholder="Cerca un estudiant..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="students-list no-team">
                  {filteredEstudiantesSinEquipo.map((estudiante) => (
                    <div key={estudiante.id} className="student-item">
                      <span>{estudiante.nombre}</span>
                      <button
                        className={`add-member-button ${
                          miembrosSeleccionados.includes(estudiante.id)
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => handleAddMember(estudiante.id)}
                      >
                        ➕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="edit-actions">
                  <button
                    className="confirm-button"
                    onClick={handleSaveChanges}
                  >
                    Fer canvis
                  </button>
                  <button className="cancel-button" onClick={handleEditToggle}>
                    Cancel·lar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="equipo-members">
              <button
                className="edit-members-equipo-button"
                onClick={handleEditToggle}
              >
                Modificar membres
              </button>
              {equipo.estudiantes.map((estudiante, index) => (
                <div
                  key={estudiante.id}
                  className="member-circle"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                >
                  <i className="fas fa-user member-icon"></i>
                  <div className="member-details">
                    <p className="member-name">{estudiante.nombre}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showPopup && (
          <div className="confirm-popup">
            <div className="changes-popup-content">
              <h>
                Estas segur/a que vols{' '}
                {popupAction === 'borrar'
                  ? 'borrar aquest equip'
                  : "sortir d'aquest equip"}
                ?
              </h>
              <p className="popup-subtext">
                {popupAction === 'borrar'
                  ? "Es perdrà tota la informació d'aquest equip."
                  : "Perdràs totes les dades d'aquest equip."}
              </p>
              <button className="confirm-button" onClick={handlePopupConfirm}>
                Confirmar
              </button>
              <button className="cancel-button" onClick={handlePopupCancel}>
                Cancel·lar
              </button>
            </div>
          </div>
        )}
        {showConfirmChangesPopup && (
          <div className="confirm-popup">
            <div className="changes-popup-content">
              <h>
                Estàs segur/a que vols fer aquestes modificacions als membres de
                l&apos;equip?
              </h>
              {/* Mensaje de error */}
              {miembrosAEliminar.length === equipo.estudiantes.length &&
                miembrosAAgregar.length === 0 && (
                  <p className="creating-error-message">
                    No pots eliminar a tots els membres de l&apos;equip i no
                    afegir-ne a cap. En tot cas, esborra l&apos;equip.
                  </p>
                )}

              <button
                className="confirm-button"
                onClick={handleConfirmChanges}
                disabled={
                  miembrosAEliminar.length === equipo.estudiantes.length &&
                  miembrosAAgregar.length === 0
                } // Deshabilita si la condición es verdadera
              >
                Confirmar
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowConfirmChangesPopup(false)}
              >
                Cancel·lar
              </button>
            </div>
          </div>
        )}

        {showDisconnectPopup && (
          <div className="confirm-popup">
            <div className="changes-popup-content">
              <h>
                Estàs segur/a que vols desconnectar aquesta organització de
                GitHub de l&apos;equip?
              </h>
              <button
                className="confirm-button"
                onClick={handleConfirmDisconnect}
              >
                Confirmar
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowDisconnectPopup(false)}
              >
                Cancel·lar
              </button>
            </div>
          </div>
        )}
        {showDisconnectPopupTaiga && (
          <div className="confirm-popup">
            <div className="changes-popup-content">
              <h>
                Segur que vols desvincular aquest projecte de Taiga de
                l&apos;equip?
              </h>
              <button
                className="confirm-button"
                onClick={handleConfirmDisconnectTaiga}
              >
                Confirmar
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowDisconnectPopupTaiga(false)}
              >
                Cancel·lar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipoPage;
