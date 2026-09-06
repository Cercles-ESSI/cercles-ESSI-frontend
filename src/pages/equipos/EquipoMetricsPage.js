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
  const [isSyncing, setIsSyncing] = useState(false);

  const formatUltimaSincronizacion = (fechaIso) => {
    if (!fechaIso) return 'Mai';

    const fecha = new Date(fechaIso);
    return fecha.toLocaleString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleManualSync = async () => {
    if (!id || !localOrg) return;

    try {
      setIsSyncing(true);
      const isGitHub = true;
      await syncGitHubMetrics(
        localOrg,
        localEstudiantesIds,
        equipo.id,
        token,
        isGitHub,
      );
      console.log('Sincronització manual de Taiga completada.');

      // Volvemos a cargar los datos para que la pantalla se actualice con lo nuevo
      await fetchMetrics(equipo.id);
    } catch (err) {
      console.error('Error en sync manual:', err);
    } finally {
      setIsSyncing(false); // Ocultamos el texto
    }
  };

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

  if (loadingEquipo) {
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start', // Cambiado a flex-start para que no se descentre con la altura de la fecha
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '20px', // Un poco de espacio antes de la tabla
          }}
        >
          <h3>Nom de l&apos;organització {org}</h3>

          {/* Contenedor vertical para el botón y la fecha */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {isSyncing && (
                <span
                  style={{
                    color: '#0284c7',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                  }}
                >
                  Sincronitzant dades... ⏳
                </span>
              )}
              <button
                onClick={handleManualSync}
                disabled={isSyncing || loadingMetrics}
                style={{
                  padding: '10px 16px',
                  backgroundColor: isSyncing ? '#94a3b8' : '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'background-color 0.2s',
                }}
              >
                Forçar Sincronització
              </button>
            </div>

            {/*Texto de última actualización */}
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Última actualització:{' '}
              {equipo
                ? formatUltimaSincronizacion(equipo.ultimaSincronizacionGit)
                : 'Desconeguda'}
            </span>
          </div>
        </div>

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
