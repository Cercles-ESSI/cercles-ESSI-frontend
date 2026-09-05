import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getMetricsP,
  getEquipoDetalle,
  syncGitHubMetrics,
} from '../../services/Equipos_Api';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import Sidebar from '../../components/common/Sidebar';
import './EquipoMetricsPage.css';
import loadingGif from '../../assets/images/15-28-43-29_512.webp';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

const EquipoMetricsGitHub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const org = searchParams.get('org');
  const estudiantesIdsString = searchParams.get('estudiantesIds');
  const estudiantesIds = estudiantesIdsString
    ? estudiantesIdsString.split(',').map(Number)
    : [];
  const token = localStorage.getItem('jwtToken');
  const [equipo, setEquipo] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [globalIssueDetails, setGlobalIssueDetails] = useState([]);
  const [loadingEquipo, setLoadingEquipo] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [progress, setProgress] = useState(0);
  const [localOrg, setLocalOrg] = useState(null);
  const [error, setError] = useState(null);
  const [localEstudiantesIds, setLocalEstudiantesIds] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchEquipoDetalle = async () => {
      try {
        setLoadingEquipo(true);
        const equipoData = await getEquipoDetalle(id, token);
        setEquipo(equipoData);
      } catch (error) {
        setError("No se pudo carregar la informació de l'equip.");
      } finally {
        setLoadingEquipo(false);
      }
    };

    fetchEquipoDetalle();
  }, [id, token]);

  useEffect(() => {
    // Actualiza solo si hay cambios
    if (
      org !== localOrg ||
      JSON.stringify(estudiantesIds) !== JSON.stringify(localEstudiantesIds)
    ) {
      setLocalOrg(org);
      setLocalEstudiantesIds(estudiantesIds);
    }
  }, [org, estudiantesIds]);

  const fetchMetrics = async (equipoId) => {
    try {
      setLoadingMetrics(true);

      const data = await getMetricsP(equipo.id, token);

      if (data && data.userMetrics && data.globalIssueDetails) {
        console.log('Datos obtenidos en fetchMetrics:', data);
        setMetrics(data.userMetrics);
        setGlobalIssueDetails(data.globalIssueDetails);
      } else {
        console.error('La respuesta no tiene las claves esperadas:', data);
        setError('Error: La respuesta del servidor no es válida.');
      }
    } catch (error) {
      console.error('Error en fetchMetrics:', error.message);
      setError('Error al obtener las métricas.');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!localOrg || !localEstudiantesIds?.length || equipo === null) return;

    fetchMetrics(equipo.id);

    const isGitHub = true;

    syncGitHubMetrics(
      localOrg,
      localEstudiantesIds,
      equipo.id,
      token,
      isGitHub,
    ).then(() => {
      console.log('Sincronització de GitHub completada.');
      fetchMetrics(equipo.id);
    });
  }, [localOrg, localEstudiantesIds, equipo, token]);

  useEffect(() => {
    let interval;
    if (loadingEquipo || loadingMetrics) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 50);
    }

    return () => clearInterval(interval);
  }, [loadingEquipo, loadingMetrics]);

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

  const handleBackClick = () => {
    navigate(-1);
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="metrics-page">
      <Sidebar />
      <div className="metrics-content">
        <button className="back-button" onClick={handleBackClick}>
          Torna enrere
        </button>
        <h1>
          Rendiment a GitHub - Equip {equipo.nombre} pel curs{' '}
          {equipo.nombreAsignatura}
        </h1>
        <h1>Nom de l&apos;organització {org}</h1>

        {/* Primera Tabla */}
        <h3>Mètriques d&apos;històries d&apos;usuari i tasques</h3>
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
                  metrics.reduce((sum, m) => sum + m.tasks, 0) / metrics.length
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
        {/* Sección Expandible */}
        <div>
          <h2
            onClick={() => setIsExpanded((prevState) => !prevState)}
            className="expandable-header"
          >
            Veure detalls de les històries d&apos;usuari i les tasques{' '}
            {isExpanded ? '▲' : '▼'}
          </h2>

          {isExpanded && (
            <>
              {/* Tabla de historias de usuario */}
              <h3>Històries d&apos;usuari</h3>
              <table>
                <thead>
                  <tr>
                    <th>Detalls</th>
                    {metrics.map((m) => (
                      <th key={m.username}>{m.nombre}</th>
                    ))}
                    <th>No assignat</th>
                  </tr>
                </thead>
                <tbody>
                  {globalIssueDetails
                    .filter((detail) => detail.type === 'USER_STORY')
                    .map((detail, index) => {
                      const shortDetail = `[${detail.number}] ${detail.title}`;
                      const noAssignat = detail.assignees.length === 0;

                      return (
                        <tr key={`user-story-${index}`}>
                          <td>{shortDetail}</td>

                          {metrics.map((m) => (
                            <td key={`user-story-detail-${m.username}`}>
                              {detail.assignees.includes(m.username) //
                                ? '✔️'
                                : ''}
                            </td>
                          ))}

                          <td>{noAssignat ? '✔️' : ''}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {/* Tabla de tareas */}
              <h3>Tasques</h3>
              <table>
                <thead>
                  <tr>
                    <th>Detalls</th>
                    {metrics.map((m) => (
                      <th key={m.username}>{m.nombre}</th>
                    ))}
                    <th>No assignat</th>
                  </tr>
                </thead>
                <tbody>
                  {globalIssueDetails
                    .filter((detail) => detail.type === 'TASK')
                    .map((detail, index) => {
                      const shortDetail = `[${detail.number}] ${detail.title}`;
                      const noAssignat = detail.assignees.length === 0; //

                      return (
                        <tr key={`task-${index}`}>
                          <td>{shortDetail}</td>

                          {metrics.map((m) => (
                            <td key={`task-detail-${m.username}`}>
                              {detail.assignees.includes(m.username)
                                ? '✔️'
                                : ''}
                            </td>
                          ))}

                          <td>{noAssignat ? '✔️' : ''}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Gráficos */}
        <h3>GRÀFICS</h3>
        <div className="charts-section">
          {/* Segunda fila de gráficos */}
          <div className="chart-row">
            <div className="chart-container-large">
              <h2>Històries d&apos;usuari i tasques tancades</h2>
              <Bar
                data={{
                  labels: metrics.map((m) => m.nombre),
                  datasets: [
                    {
                      label: 'HU tancades',
                      data: metrics.map((m) => m.userStoriesClosed),
                      backgroundColor: '#A7D2CB',
                    },
                    {
                      label: 'Tasques tancades',
                      data: metrics.map((m) => m.tasksClosed),
                      backgroundColor: '#F2D388',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      labels: {
                        font: {
                          size: 16,
                        },
                      },
                    },
                  },
                  scales: {
                    x: { ticks: { font: { size: 14 } } },
                    y: { ticks: { font: { size: 14 } } },
                  },
                }}
              />
            </div>
            <div className="chart-container">
              <h2>Distribució d&apos;històries d&apos;usuari totals</h2>
              <Pie
                data={{
                  labels: metrics.every((m) => m.userStories === 0)
                    ? ['No hi ha cap HU']
                    : metrics.map((m) => m.nombre),
                  datasets: [
                    {
                      data: metrics.every((m) => m.userStories === 0)
                        ? [1] // Valor fijo para el caso de "No hi ha cap HU"
                        : metrics.map((m) => m.userStories),
                      backgroundColor: metrics.every((m) => m.userStories === 0)
                        ? ['#C0C0C0'] // Color gris para "No hi ha cap HU"
                        : [
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
                          ],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      labels: {
                        font: {
                          size: 16,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipoMetricsGitHub;
