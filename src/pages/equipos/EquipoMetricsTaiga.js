import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getTaigaMetrics,
  getEquipoDetalle,
  syncTaigaMetrics,
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
import './EquipoMetricsTaiga.css';
import loadingGif from '../../assets/images/15-28-43-29_512.webp';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

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
          Mètriques de Taiga de l&apos;equip {equipo.nombre} pel curs{' '}
          {equipo.nombreAsignatura}
        </h1>

        <div className="taiga-section">
          <h3>Resum de contribucions individuals a Taiga </h3>

          {loadingTaigaLocal ? (
            <p className="loading-text">🔄 Carregant dades des de Taiga...</p>
          ) : (
            datosMetricas &&
            datosMetricas.metricasEstudiantes && (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Dades</th>
                      {datosMetricas.metricasEstudiantes.map(
                        (estudiante, index) => (
                          <th key={index}>{estudiante.nombreEstudiante}</th>
                        ),
                      )}
                      <th className="mitjana-column">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* FILA 1: Valores Absolutos */}
                    <tr>
                      <td>Total tasques</td>
                      {datosMetricas.metricasEstudiantes.map(
                        (estudiante, index) => (
                          <td key={index}>{estudiante.totalTareas}</td>
                        ),
                      )}
                      <td className="mitjana-column">
                        {datosMetricas.totalTareasEquipo}
                      </td>
                    </tr>

                    {/* FILA 2: Porcentajes */}
                    <tr>
                      <td>Total tasques (%)</td>
                      {datosMetricas.metricasEstudiantes.map(
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
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipoMetricsTaiga;
