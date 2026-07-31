import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getMetrics,
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

const EquipoMetricsPage = () => {
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

      // 1. Registrar el tiempo de inicio antes de la llamada a la API
      const startTime = performance.now();
      const data = await getMetrics(equipo.id, token);

      // 2. Registrar el tiempo final y calcular la diferencia
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2); // Milisegundos con 2 decimales
      console.log(`El tiempo de carga de getMetrics fue de: ${duration} ms`);

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

  //Sincronizacion en segundo plano de GITHUB
  useEffect(() => {
    if (!localOrg || !localEstudiantesIds?.length || equipo === null) return;
    fetchMetrics(equipo.id);

    const isGitHub = false;
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
          Carregant les dades... Si us plau, espereu!
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
          Mètriques de GitHub de l&apos;equip {equipo.nombre} pel curs{' '}
          {equipo.nombreAsignatura}
        </h1>
        <h2 style={{ marginBottom: '2rem' }}>
          Nom de l&apos;organització: {org}
        </h2>

        {/* --- INICIO DE LA TARJETA (CARD) PARA LA TABLA --- */}
        <div className="card">
          <h2 style={{ color: '#475569', marginBottom: '1.5rem' }}>
            Mètriques de les contribucions dels usuaris
          </h2>

          <div className="table-responsive">
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
                      metrics.reduce(
                        (sum, m) => sum + m.pullRequestsCreated,
                        0,
                      ) / metrics.length
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
                      metrics.reduce(
                        (sum, m) => sum + m.pullRequestsMerged,
                        0,
                      ) / metrics.length
                    ).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* --- FIN DE LA TARJETA --- */}

        {/* Gráficos */}
        <div className="github-charts" style={{ marginTop: '3rem' }}>
          <h3>GRÀFICS</h3>
          <div className="charts-section">
            {/* Primera fila de gráficos */}
            <div className="chart-row">
              <div className="chart-container">
                <h2 style={{ marginBottom: '20px' }}>Distribució de commits</h2>
                <div
                  style={{
                    position: 'relative',
                    height: '350px',
                    width: '100%',
                  }}
                >
                  <Pie
                    data={{
                      labels: metrics.map((m) => m.nombre),
                      datasets: [
                        {
                          data: metrics.map((m) => m.totalCommits),
                          backgroundColor: [
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
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
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
              <div className="chart-container">
                <h2 style={{ marginBottom: '20px' }}>
                  Línies afegides i eliminades
                </h2>
                <div
                  style={{
                    position: 'relative',
                    height: '350px',
                    width: '100%',
                  }}
                >
                  <Bar
                    data={{
                      labels: metrics.map((m) => m.nombre),
                      datasets: [
                        {
                          label: 'Línies afegides',
                          data: metrics.map((m) => m.linesAdded),
                          backgroundColor: '#6C9975',
                        },
                        {
                          label: 'Línies eliminades',
                          data: metrics.map((m) => m.linesRemoved),
                          backgroundColor: '#BB6365',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipoMetricsPage;
