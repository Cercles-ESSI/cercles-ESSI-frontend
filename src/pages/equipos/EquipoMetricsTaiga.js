import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getTaigaMetrics,
  getEquipoDetalle,
  syncTaigaMetrics,
} from '../../services/Equipos_Api';
import Sidebar from '../../components/common/Sidebar';
import './EquipoMetricsTaiga.css';
import loadingGif from '../../assets/images/15-28-43-29_512.webp';
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

const EquipoMetricsTaiga = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const proyecto = searchParams.get('project');
  const estudiantesIdsString = searchParams.get('estudiantesIds');
  const estudiantesIds = estudiantesIdsString
    ? estudiantesIdsString.split(',').map(Number)
    : [];

  const token = localStorage.getItem('jwtToken');

  // Estados
  const [equipo, setEquipo] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [globalIssueDetails, setGlobalIssueDetails] = useState([]);
  const [loadingEquipo, setLoadingEquipo] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [localEstudiantesIds, setLocalEstudiantesIds] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Estados para Taiga (Base de Datos Local)
  const [datosMetricas, setDatosMetricas] = useState(null);
  const [loadingTaigaLocal, setLoadingTaigaLocal] = useState(true);

  // --- FUNCIÓN DE CARGA DE TAIGA LOCAL ---
  const cargarEstadisticasLocales = async (equipoId, proyecto) => {
    try {
      if (!datosMetricas) setLoadingTaigaLocal(true);

      // Le pasamos la variable nombreProyecto a la API
      const data = await getTaigaMetrics(equipoId, proyecto, token);
      setDatosMetricas(data);
    } catch (err) {
      console.error('Error en cargarEstadisticasLocales:', err);
    } finally {
      setLoadingTaigaLocal(false);
    }
  };

  // 1. Cargar Detalle del Equipo
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

  // 2. Sincronizar IDs de estudiantes
  useEffect(() => {
    if (
      JSON.stringify(estudiantesIds) !== JSON.stringify(localEstudiantesIds)
    ) {
      setLocalEstudiantesIds(estudiantesIds);
    }
  }, [estudiantesIds, localEstudiantesIds]);

  // 4. Sincronización en segundo plano de TAIGA (Carga en 2 tiempos)
  useEffect(() => {
    if (id && proyecto) {
      // 1. Cargamos lo local pasándole el proyecto
      cargarEstadisticasLocales(id, proyecto);

      // 2. Sincronizamos pasándole también el proyecto
      syncTaigaMetrics(id, proyecto, token)
        .then(() => {
          console.log(
            'Sincronització de Taiga completada. Actualitzant taula...',
          );
          cargarEstadisticasLocales(id, proyecto);
        })
        .catch((err) => console.error('Error en sync en segon pla:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, proyecto, token]);

  // 5. Animación del progreso de carga
  useEffect(() => {
    let interval;
    if (loadingEquipo || loadingMetrics) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [loadingEquipo, loadingMetrics]);

  // --- BLOQUEOS DE PANTALLA ---
  if (loadingEquipo) {
    return (
      <div className="loading-container">
        <img src={loadingGif} alt="Cargando..." className="loading-gif" />
        <p className="loading-text">
          Carregant les dades... Si us plau, espereu! ⏳
        </p>
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;

  const handleBackClick = () => navigate(-1);

  return (
    <div className="metrics-page">
      <Sidebar />
      <div className="metrics-content">
        <button className="back-button" onClick={handleBackClick}>
          Torna enrere
        </button>

        <h1>
          Rendiment a Taiga - Equip {equipo.nombre} pel curs{' '}
          {equipo.nombreAsignatura}
        </h1>

        <div className="taiga-section">
          <h3>Resum de contribucions individuals a Taiga </h3>

          {loadingTaigaLocal ? (
            <p className="loading-text">🔄 Carregant dades des de Taiga...</p>
          ) : (
            datosMetricas &&
            datosMetricas.estadisticasTareas && (
              <>
                {/* TABLA 1: VALORES ABSOLUTOS */}
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Dades</th>
                        {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                          (estudiante, index) => (
                            <th key={index}>{estudiante.nombreEstudiante}</th>
                          ),
                        )}
                        <th className="mitjana-column">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Valores Absolutos de Tareas */}
                      <tr>
                        <td>Total tasques</td>
                        {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                          (estudiante, index) => (
                            <td key={index}>{estudiante.totalTareas}</td>
                          ),
                        )}
                        <td className="mitjana-column">
                          {datosMetricas.estadisticasTareas.totalTareasEquipo}
                        </td>
                      </tr>

                      {/* Valores Absolutos de Historias */}
                      <tr>
                        <td>Total històries participades</td>
                        {datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                          (estudiante, index) => (
                            <td key={index}>
                              {estudiante.totalHistoriasParticipadas}
                            </td>
                          ),
                        )}
                        <td className="mitjana-column">
                          {datosMetricas.estadisticasHistorias.totalHistorias}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TABLA 2: PORCENTAJES */}
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Dades</th>
                        {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                          (estudiante, index) => (
                            <th key={index}>{estudiante.nombreEstudiante}</th>
                          ),
                        )}
                        <th className="mitjana-column">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Porcentajes de Tareas */}
                      <tr>
                        <td>Total tasques (%)</td>
                        {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                          (estudiante, index) => {
                            const porcentaje = estudiante.porcentajeTareas || 0;
                            const porcentajeFormateado =
                              porcentaje.toLocaleString('es-ES', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              });

                            return <td key={index}>{porcentajeFormateado}%</td>;
                          },
                        )}
                        <td className="mitjana-column">100,0%</td>
                      </tr>

                      {/* Porcentajes de Historias */}
                      <tr>
                        <td>Participació en històries (%)</td>
                        {datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                          (estudiante, index) => {
                            const porcentaje =
                              estudiante.porcentajeHistorias || 0;
                            const porcentajeFormateado =
                              porcentaje.toLocaleString('es-ES', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              });

                            return <td key={index}>{porcentajeFormateado}%</td>;
                          },
                        )}
                        <td className="mitjana-column">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="taiga-charts" style={{ marginTop: '3rem' }}>
                  <h3>GRÀFICS</h3>
                  <div className="charts-section">
                    {/* Primera fila de gráficos (Los dos quesos) */}
                    <div className="chart-row">
                      <div className="chart-container">
                        <h2>Repartiment de Tasques (%)</h2>
                        <div
                          style={{
                            position: 'relative',
                            height: '350px',
                            width: '100%',
                          }}
                        >
                          <Pie
                            data={{
                              labels:
                                datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                                  (m) => m.nombreEstudiante,
                                ),
                              datasets: [
                                {
                                  data: datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                                    (m) => m.porcentajeTareas,
                                  ),
                                  backgroundColor: [
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
                                  ],
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { labels: { font: { size: 14 } } },
                                tooltip: {
                                  callbacks: {
                                    label: (context) =>
                                      ` ${context.raw.toFixed(1)}%`,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      <div className="chart-container">
                        <h2>Participació en Històries (%)</h2>
                        <div
                          style={{
                            position: 'relative',
                            height: '350px',
                            width: '100%',
                          }}
                        >
                          <Pie
                            data={{
                              labels:
                                datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                  (m) => m.nombreEstudiante,
                                ),
                              datasets: [
                                {
                                  data: datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                    (m) => m.porcentajeHistorias,
                                  ),
                                  backgroundColor: [
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
                                  ],
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { labels: { font: { size: 14 } } },
                                tooltip: {
                                  callbacks: {
                                    label: (context) =>
                                      ` ${context.raw.toFixed(1)}%`,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Segunda fila de gráficos (Barras) */}
                    <div className="chart-row">
                      <div className="chart-container-large">
                        <h2>Històries d&apos;usuari i tasques</h2>
                        <div
                          style={{
                            position: 'relative',
                            height: '400px',
                            width: '100%',
                          }}
                        >
                          <Bar
                            data={{
                              labels:
                                datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                  (m) => m.nombreEstudiante,
                                ),
                              datasets: [
                                {
                                  label: 'HU Tancades',
                                  data: datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                    (m) => m.totalHistoriasCerradas || 0,
                                  ),
                                  backgroundColor: '#A7D2CB',
                                },
                                {
                                  label: 'Total Tasques',
                                  data: datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                                    (m) => m.totalTareas,
                                  ),
                                  backgroundColor: '#F2D388',
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { labels: { font: { size: 16 } } },
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
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipoMetricsTaiga;
