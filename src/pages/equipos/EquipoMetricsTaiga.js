import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getTaigaMetrics,
  getEquipoDetalle,
  syncTaigaMetrics,
} from '../../services/Equipos_Api';
import { getIdsEvaluaciones } from '../../services/Evaluaciones_Api';
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

  // --- ESTADOS ORIGINALES ---
  const [equipo, setEquipo] = useState(null);
  const [loadingEquipo, setLoadingEquipo] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [localEstudiantesIds, setLocalEstudiantesIds] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Estados para Taiga (Base de Datos Local)
  const [datosMetricas, setDatosMetricas] = useState(null);
  const [loadingTaigaLocal, setLoadingTaigaLocal] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- ESTADOS DEL FILTRO ---
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('global');
  const [sprints, setSprints] = useState([]);

  const cargarEstadisticasLocales = async (equipoId, proyecto, filtroStr) => {
    try {
      setLoadingTaigaLocal(true);

      let tipoFiltro = 'global';
      let evaluacionId = null;

      if (filtroStr.startsWith('sprint-')) {
        tipoFiltro = 'sprint';
        evaluacionId = filtroStr.split('-')[1];
      }

      // Le pasamos el filtro a la API
      const data = await getTaigaMetrics(
        equipoId,
        proyecto,
        token,
        tipoFiltro,
        evaluacionId,
      );
      setDatosMetricas(data);
    } catch (err) {
      console.error('Error en cargarEstadisticasLocales:', err);
    } finally {
      setLoadingTaigaLocal(false);
    }
  };

  const handleManualSync = async () => {
    if (!id || !proyecto) return;

    try {
      setIsSyncing(true); // Mostramos el texto de "Sincronizando..."
      await syncTaigaMetrics(id, proyecto, token);
      console.log('Sincronització manual de Taiga completada.');

      // Volvemos a cargar los datos para que la pantalla se actualice con lo nuevo
      await cargarEstadisticasLocales(id, proyecto, filtroSeleccionado);
    } catch (err) {
      console.error('Error en sync manual:', err);
    } finally {
      setIsSyncing(false); // Ocultamos el texto
    }
  };

  // 1. Cargar Detalle del Equipo y Sprints
  useEffect(() => {
    const fetchEquipoDetalle = async () => {
      try {
        setLoadingEquipo(true);
        const equipoData = await getEquipoDetalle(id, token);
        setEquipo(equipoData);

        const ids = await getIdsEvaluaciones(equipoData.cursoId, token);

        // Transformamos el array de números [13, 14, 15] a objetos para el desplegable
        const sprintsData = ids.map((sprintId) => ({
          id: sprintId,
        }));

        setSprints(sprintsData);
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

  // 3. Sincronización en segundo plano de TAIGA (Solo se ejecuta al entrar a la página)
  useEffect(() => {
    if (id && proyecto) {
      syncTaigaMetrics(id, proyecto, token)
        .then(() => {
          console.log('Sincronització de Taiga completada.');
          // Tras sincronizar, recargamos los datos con el filtro que esté puesto
          cargarEstadisticasLocales(id, proyecto, filtroSeleccionado);
        })
        .catch((err) => console.error('Error en sync en segon pla:', err));
    }
  }, [id, proyecto, token]);

  // 4. Efecto para reaccionar a los cambios del Filtro
  useEffect(() => {
    if (id && proyecto) {
      cargarEstadisticasLocales(id, proyecto, filtroSeleccionado);
    }
    // Cada vez que filtroSeleccionado cambie, pedimos los nuevos datos
  }, [id, proyecto, token, filtroSeleccionado]);

  // 5. Animación del progreso de carga
  useEffect(() => {
    let interval;
    if (loadingEquipo || loadingTaigaLocal) {
      interval = setInterval(
        () => setProgress((prev) => (prev >= 100 ? 0 : prev + 1)),
        50,
      );
    }
    return () => clearInterval(interval);
  }, [loadingEquipo, loadingTaigaLocal]);

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

  return (
    <div className="metrics-page">
      <Sidebar />
      <div className="metrics-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          Torna enrere
        </button>

        <h1>
          Rendiment a Taiga - Equip {equipo.nombre} pel curs{' '}
          {equipo.nombreAsignatura}
        </h1>

        <div className="taiga-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Resum de contribucions individuals a Taiga
            </h3>

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
                disabled={isSyncing || loadingTaigaLocal}
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
          </div>

          {/* --- BARRA DE FILTROS --- */}
          <div style={filterContainerStyle}>
            <div style={filterGroupStyle}>
              <label htmlFor="filtro-tiempo" style={labelStyle}>
                Filtrar dades:
              </label>
              <select
                id="filtro-tiempo"
                value={filtroSeleccionado}
                onChange={(e) => setFiltroSeleccionado(e.target.value)}
                style={selectStyle}
              >
                <option value="global">Global (Tot el projecte)</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={`sprint-${sprint.id}`}>
                    Sprint: {sprint.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* ------------------------ */}

          {loadingTaigaLocal ? (
            <p className="loading-text">🔄 Carregant dades des de Taiga...</p>
          ) : (
            datosMetricas &&
            datosMetricas.estadisticasTareas && (
              <>
                <div className="card">
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
                  <div
                    className="table-responsive"
                    style={{ marginTop: '2rem' }}
                  >
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
                        <tr>
                          <td>Total tasques (%)</td>
                          {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                            (estudiante, index) => (
                              <td key={index}>
                                {(
                                  estudiante.porcentajeTareas || 0
                                ).toLocaleString('es-ES', {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                                %
                              </td>
                            ),
                          )}
                          <td className="mitjana-column">100,0%</td>
                        </tr>
                        <tr>
                          <td>Participació en històries (%)</td>
                          {datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                            (estudiante, index) => (
                              <td key={index}>
                                {(
                                  estudiante.porcentajeHistorias || 0
                                ).toLocaleString('es-ES', {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                                %
                              </td>
                            ),
                          )}
                          <td className="mitjana-column">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* TABLA 3: DETALLES TAIGA */}
                  <h3
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="expandable-header"
                    style={{ marginTop: '2rem', cursor: 'pointer' }}
                  >
                    Veure detalls de les històries d&apos;usuari i les tasques{' '}
                    {isExpanded ? '▲' : '▼'}
                  </h3>

                  {isExpanded && (
                    <div
                      className="table-responsive"
                      style={{ marginTop: '1.5rem' }}
                    >
                      <h3
                        style={{
                          marginBottom: '1.5rem',
                          fontSize: '1.2rem',
                          color: '#475569',
                        }}
                      >
                        Detalls a Taiga
                      </h3>
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nom HU</th>
                            <th>Estat</th>
                            <th>SP</th>
                            <th>Sprint</th>
                            {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                              (estudiante, index) => (
                                <th key={index}>
                                  {estudiante.nombreEstudiante}
                                </th>
                              ),
                            )}
                            <th>Sense assignar</th>
                            <th className="mitjana-column">Total tasques</th>
                            <th className="mitjana-column">Total membres</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosMetricas.detallesTaiga &&
                            datosMetricas.detallesTaiga.map(
                              (historia, rowIndex) => (
                                <tr key={rowIndex}>
                                  <td>{historia.id}</td>
                                  <td>{historia.titulo}</td>
                                  <td>{historia.estado}</td>
                                  <td>{historia.puntosEsfuerzo}</td>
                                  <td>{historia.sprint || 'Backlog'}</td>
                                  {datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                                    (estudiante, colIndex) => (
                                      <td key={colIndex}>
                                        {historia.tareasPorEstudiante[
                                          estudiante.nombreEstudiante
                                        ] || 0}
                                      </td>
                                    ),
                                  )}
                                  <td>{historia.tareasSinAsignar}</td>
                                  <td className="mitjana-column">
                                    {historia.totalTareas}
                                  </td>
                                  <td className="mitjana-column">
                                    {historia.totalMiembros}
                                  </td>
                                </tr>
                              ),
                            )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* --- GRÁFICOS ---  */}
                <div className="taiga-charts" style={{ marginTop: '3rem' }}>
                  <h3>GRÀFICS</h3>
                  <div className="charts-section">
                    {/* Primera fila de gráficos (Quesos) */}
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
                                    '#E27D60',
                                    '#85CDCA',
                                    '#E8A87C',
                                    '#C38D9E',
                                    '#41B3A3',
                                    '#8D94BA',
                                    '#F3B562',
                                    '#D96459',
                                    '#76B096',
                                    '#A37C40',
                                    '#F2E394',
                                    '#B8C4BB',
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
                                    label: (c) => ` ${c.raw.toFixed(1)}%`,
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
                                    '#E27D60',
                                    '#85CDCA',
                                    '#E8A87C',
                                    '#C38D9E',
                                    '#41B3A3',
                                    '#8D94BA',
                                    '#F3B562',
                                    '#D96459',
                                    '#76B096',
                                    '#A37C40',
                                    '#F2E394',
                                    '#B8C4BB',
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
                                    label: (c) => ` ${c.raw.toFixed(1)}%`,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Segunda fila de gráficos (Barras Apiladas y SP) */}
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
                                  label: 'HU Obertes',
                                  data: datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                    (m) => m.historiasAbiertas || 0,
                                  ),
                                  backgroundColor: '#A7D2CB',
                                  stack: 'Stack_HU',
                                },
                                {
                                  label: 'HU Tancades',
                                  data: datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                    (m) =>
                                      m.historiasCerradas ||
                                      m.totalHistoriasCerradas ||
                                      0,
                                  ),
                                  backgroundColor: '#5b8263',
                                  stack: 'Stack_HU',
                                },
                                {
                                  label: 'Tasques Obertes',
                                  data: datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                                    (m) => m.tareasAbiertas || 0,
                                  ),
                                  backgroundColor: '#F2D388',
                                  stack: 'Stack_Tasques',
                                },
                                {
                                  label: 'Tasques Tancades',
                                  data: datosMetricas.estadisticasTareas.metricasEstudiantes.map(
                                    (m) => m.tareasCerradas || 0,
                                  ),
                                  backgroundColor: '#e5c158',
                                  stack: 'Stack_Tasques',
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { labels: { font: { size: 16 } } },
                                tooltip: { mode: 'index', intersect: false },
                              },
                              scales: {
                                x: {
                                  stacked: true,
                                  ticks: { font: { size: 14 } },
                                },
                                y: {
                                  stacked: true,
                                  ticks: { font: { size: 14 } },
                                  beginAtZero: true,
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      <div className="chart-container-large">
                        <h2>Punts d&apos;Esforç (SP) per Estudiant</h2>
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
                                  label: 'Story Points Totals',
                                  data: datosMetricas.estadisticasHistorias.metricasEstudiantes.map(
                                    (m) => m.puntosEsfuerzo || 0,
                                  ),
                                  backgroundColor: '#8da0cb',
                                  borderRadius: 5,
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
                                y: {
                                  ticks: { font: { size: 14 } },
                                  beginAtZero: true,
                                },
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

// --- ESTILOS DEL FILTRO ---
const filterContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '30px',
  marginTop: '20px',
};

const filterGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f8fafc',
  padding: '12px 24px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
};

const labelStyle = {
  fontWeight: '600',
  color: '#475569',
  marginRight: '15px',
  fontSize: '1rem',
};

const selectStyle = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  backgroundColor: 'white',
  color: '#334155',
  fontSize: '0.95rem',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '220px',
  fontWeight: '500',
};

export default EquipoMetricsTaiga;
