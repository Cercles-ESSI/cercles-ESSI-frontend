import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getEquipoDetalle,
  getMetrics,
  getMetricsP,
  getTaigaMetrics,
} from '../../services/Equipos_Api';
import { getEvaluacionesPorEquipo } from '../../services/Evaluaciones_Api';
import Sidebar from '../../components/common/Sidebar';
import './DatosGeneralesEquipoPage.css';
import loadingGif from '../../assets/images/15-28-43-29_512.webp';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const DatosGeneralesEquipoPage = () => {
  const { equipoId } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const org = queryParams.get('org');
  const estudiantesIdsString = queryParams.get('estudiantesIds');
  const estudiantesIds = estudiantesIdsString
    ? estudiantesIdsString.split(',').map(Number)
    : [];
  const token = localStorage.getItem('jwtToken');

  const [medias, setMedias] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [equipo, setEquipo] = useState(null);
  const [loadingEquipo, setLoadingEquipo] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState(null);
  const [localOrg, setLocalOrg] = useState(null);
  const [localEstudiantesIds, setLocalEstudiantesIds] = useState([]);

  const navigate = useNavigate();

  // Cargar datos del equipo y evaluaciones
  useEffect(() => {
    const fetchEquipoDetalle = async () => {
      try {
        setLoadingEquipo(true);
        const equipoData = await getEquipoDetalle(equipoId, token);
        const mediasData = await getEvaluacionesPorEquipo(equipoId, token);
        setEquipo(equipoData);
        setMedias(mediasData);
      } catch (error) {
        console.error('Error en fetchEquipoDetalle:', error.message);
        setError("No es pot carregar la informació de l'equip.");
      } finally {
        setLoadingEquipo(false);
      }
    };

    fetchEquipoDetalle();
  }, [equipoId, token]);

  // Actualizar org y estudiantes localmente solo si cambian
  useEffect(() => {
    if (
      org !== localOrg ||
      JSON.stringify(estudiantesIds) !== JSON.stringify(localEstudiantesIds)
    ) {
      setLocalOrg(org);
      setLocalEstudiantesIds(estudiantesIds);
    }
  }, [org, estudiantesIds]);

  // Cargar métricas de GitHub
  useEffect(() => {
    if (!localOrg || !localEstudiantesIds?.length || !equipo) return;

    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);

        // 1. Obtenemos las métricas base de GitHub (Commits, líneas, etc.)
        const metricsData = await getMetrics(equipo.id, token);

        // 2. Determinamos si el equipo usa Taiga o GitHub Projects

        const usaTaiga =
          equipo.gestionTareas?.toUpperCase() === 'TAIGA' &&
          equipo.taigaProyecto;

        let projectData = null;

        // 3. Hacemos la petición condicional
        if (usaTaiga) {
          projectData = await getTaigaMetrics(
            equipo.id,
            equipo.taigaProyecto,
            token,
          );
          console.log('Datos de Taiga obtenidos:', projectData);
        } else {
          projectData = await getMetricsP(equipo.id, token);
          console.log('Datos de GitHub Projects obtenidos:', projectData);
        }

        if (metricsData && metricsData.userMetrics) {
          // 4. Fusionamos los datos independientemente de la fuente
          const combinedMetrics = metricsData.userMetrics.map((baseMetric) => {
            let userStories = 0;
            let userStoriesClosed = 0;
            let tasks = 0;
            let tasksClosed = 0;

            if (usaTaiga && projectData) {
              const listaTareasTaiga =
                projectData.estadisticasTareas?.metricasEstudiantes || [];
              const listaHistoriasTaiga =
                projectData.estadisticasHistorias?.metricasEstudiantes || [];

              const metricasTareasAlumno = listaTareasTaiga.find(
                (t) => t.nombreEstudiante === baseMetric.nombre,
              );

              const metricasHistoriasAlumno = listaHistoriasTaiga.find(
                (h) => h.nombreEstudiante === baseMetric.nombre,
              );

              if (metricasTareasAlumno) {
                tasks = metricasTareasAlumno.totalTareas || 0;
                tasksClosed = metricasTareasAlumno.tareasCerradas || 0;
              }

              if (metricasHistoriasAlumno) {
                userStories =
                  metricasHistoriasAlumno.totalHistoriasParticipadas || 0;
                userStoriesClosed =
                  metricasHistoriasAlumno.historiasCerradas || 0;
              }
            } else if (!usaTaiga && projectData && projectData.userMetrics) {
              const ghMetric = projectData.userMetrics.find(
                (pm) => pm.username === baseMetric.username,
              );

              if (ghMetric) {
                userStories = ghMetric.userStories || 0;
                userStoriesClosed = ghMetric.userStoriesClosed || 0;
                tasks = ghMetric.tasks || 0;
                tasksClosed = ghMetric.tasksClosed || 0;
              }
            }

            return {
              ...baseMetric,
              userStories,
              userStoriesClosed,
              tasks,
              tasksClosed,
            };
          });

          setMetrics(combinedMetrics);
        } else {
          setError('Error: La resposta del servidor no és vàlida.');
        }
      } catch (error) {
        console.error('Error en fetchMetrics:', error.message);
        setError('Error al carregar les mètriques.');
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [localOrg, localEstudiantesIds, equipo, token]);

  if (loadingEquipo || loadingMetrics) {
    return (
      <div className="loading-container">
        <img src={loadingGif} alt="Cargando..." className="loading-gif" />
        <p className="loading-text">
          Carregant les dades... Si us plau, espereu! ⏳
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!equipo) return <p>No se pudo cargar la información del equipo.</p>;

  // Ordenar estudiantes alfabéticamente por nombre
  const sortedEstudiantes = equipo.estudiantes
    .slice() // Crear una copia del array para no modificar el original
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Crear el mapeo de IDs a nombres
  const idToName = sortedEstudiantes.reduce((map, estudiante) => {
    map[estudiante.id] = estudiante.nombre;
    return map;
  }, {});

  // Obtener los IDs en el orden alfabético
  const estudiantes = sortedEstudiantes.map((est) => est.id);

  const handleBackClick = () => {
    navigate(-1);
  };

  const colors = [
    '#E27D60', // Terracota anaranjado
    '#85CDCA', // Turquesa suave
    '#E8A87C', // Melocotón
    '#C38D9E', // Rosa malva viejo
    '#41B3A3', // Verde agua intenso
    '#8D94BA', // Azul lila
    '#F3B562', // Mostaza vivo
    '#D96459', // Rojo ladrillo
    '#76B096', // Verde salvia
    '#A37C40', // Bronce / Ocre oscuro
    '#F2E394', // Amarillo vainilla
    '#B8C4BB', // Gris verdoso muy claro
    '#E9C46A', // (Extra por si hay >12 alumnos)
    '#F4A3B3',
    '#D4A5A5',
    '#B5838D',
  ];

  const getRadarData = (metricsData) => {
    if (!metricsData || metricsData.length === 0) return [];

    const axes = [
      { key: 'totalCommits', label: 'Commits' },
      { key: 'userStories', label: 'Històries' },
      { key: 'tasks', label: 'Tasques' },
      { key: 'userStoriesClosed', label: 'Històries Tancades' },
      { key: 'tasksClosed', label: 'Tasques Tancades' },
    ];

    return axes.map((axis) => {
      const dataPoint = { metric: axis.label };

      // Calculamos el total de esta métrica en el equipo para sacar porcentajes
      const totalMetrica = metricsData.reduce(
        (sum, m) => sum + (m[axis.key] || 0),
        0,
      );

      metricsData.forEach((m) => {
        const valorBruto = m[axis.key] || 0;
        // Normalizamos a porcentaje (0-100) para que el gráfico quede proporcionado.
        // Si un alumno hizo 53 commits de 179 totales, es un ~30%.
        const porcentaje =
          totalMetrica === 0 ? 0 : (valorBruto / totalMetrica) * 100;

        dataPoint[m.nombre] = Math.round(porcentaje);
      });

      return dataPoint;
    });
  };

  const radarData = getRadarData(metrics);

  return (
    <div className="datos-generales-page">
      <Sidebar />
      <div className="general-content">
        <button className="back-button" onClick={handleBackClick}>
          Torna enrere
        </button>
        <h1>📊 Dades generals de l&apos;equip</h1>

        {/* Tabla de medias */}
        <h2>Dades generals de les avaluacions</h2>
        {medias.length > 0 ? (
          <table className="tabla-medias-generales">
            <thead>
              <tr>
                <th>Companys</th>
                {estudiantes.map((id) => (
                  <th key={`media-general-${id}`}>{idToName[id]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mitjana entre companys</td>
                {estudiantes.map((id) => {
                  const media = medias.find(
                    (media) => media.estudianteId === id,
                  );
                  const valor = media?.mediaGeneralDeCompañeros;
                  return (
                    <td
                      key={`media-general-companeros-${id}`}
                      className={
                        valor === undefined
                          ? 'na-value'
                          : valor > 11
                            ? 'high-value'
                            : valor < 9
                              ? 'low-value'
                              : ''
                      }
                    >
                      {valor?.toFixed(2) || 'N/A'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>Autoavaluació</td>
                {estudiantes.map((id) => {
                  const media = medias.find(
                    (media) => media.estudianteId === id,
                  );
                  const valor = media?.mediaGeneralPropia;
                  return (
                    <td
                      key={`media-general-propia-${id}`}
                      className={
                        valor === undefined
                          ? 'na-value'
                          : valor > 11
                            ? 'high-value'
                            : valor < 9
                              ? 'low-value'
                              : ''
                      }
                    >
                      {valor?.toFixed(2) || 'N/A'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        ) : (
          <p>No hi ha dades disponibles per a les mitjanes generals.</p>
        )}

        {/* Primera Tabla de métricas */}
        <h2>Mètriques de les contribucions dels usuaris</h2>
        {metrics.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Dades</th>
                {metrics.map((m) => (
                  <th key={m.username}>{m.nombre}</th>
                ))}
                <th className="mitjana-column">Mitjana</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#Commits</td>
                {metrics.map((m) => (
                  <td key={`commits-${m.username}`}>{m.totalCommits}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.totalCommits, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>#Línies ++</td>
                {metrics.map((m) => (
                  <td key={`linesAdded-${m.username}`}>{m.linesAdded}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.linesAdded, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>#Línies --</td>
                {metrics.map((m) => (
                  <td key={`linesRemoved-${m.username}`}>{m.linesRemoved}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.linesRemoved, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>#PRs creats</td>
                {metrics.map((m) => (
                  <td key={`prs-${m.username}`}>{m.pullRequestsCreated}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.pullRequestsCreated, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>#PRs fusionats</td>
                {metrics.map((m) => (
                  <td key={`prs-${m.username}`}>{m.pullRequestsMerged}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.pullRequestsMerged, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>No hi ha dades disponibles de contribucions.</p>
        )}

        {/* Segunda Tabla de métricas */}
        <h2>Mètriques d&apos;històries d&apos;usuari i tasques</h2>
        {metrics.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Dades</th>
                {metrics.map((m) => (
                  <th key={m.username}>{m.nombre}</th>
                ))}
                <th className="mitjana-column">Mitjana</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Històries d&apos;usuari</td>
                {metrics.map((m) => (
                  <td key={`userStories-${m.username}`}>{m.userStories}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.userStories, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Històries d&apos;usuari tancades</td>
                {metrics.map((m) => (
                  <td key={`userStoriesClosed-${m.username}`}>
                    {m.userStoriesClosed}
                  </td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.userStoriesClosed, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Tasques</td>
                {metrics.map((m) => (
                  <td key={`tasks-${m.username}`}>{m.tasks}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.tasks, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Tasques tancades</td>
                {metrics.map((m) => (
                  <td key={`tasksClosed-${m.username}`}>{m.tasksClosed}</td>
                ))}
                <td className="mitjana-column">
                  {(
                    metrics.reduce((sum, m) => sum + m.tasksClosed, 0) /
                    metrics.length
                  ).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>
            No hi ha dades disponibles de històries d&apos;usuari i tasques.
          </p>
        )}
        {/* Gráfico Spider / Radar */}
        {metrics.length > 0 && (
          <div style={{ marginTop: '40px', width: '100%', height: '400px' }}>
            <h2 style={{ textAlign: 'center' }}>Balanç de contribucions (%)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                {/* El eje de radio va de 0 a 100 porque usamos porcentajes */}
                <PolarRadiusAxis angle={30} domain={[0, 100]} />

                {metrics.map((m, index) => (
                  <Radar
                    key={m.username}
                    name={m.nombre}
                    dataKey={m.nombre}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.5}
                  />
                ))}

                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatosGeneralesEquipoPage;
