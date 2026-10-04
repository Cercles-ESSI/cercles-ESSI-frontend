import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComparativaMetrics } from '../../services/Comparativa_Api';
import './ComparativaEquipos.css';
import Sidebar from '../../components/common/Sidebar';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const ComparativaEquipos = () => {
  const { cursoId } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('jwtToken');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true); // Reiniciamos el loading por si el cursoId cambia
        const data = await getComparativaMetrics(cursoId, token);
        setDashboardData(data);
        setError(null); // Limpiamos errores previos si la petición tiene éxito
      } catch (err) {
        setError(err.message || 'Error al obtener las métricas');
      } finally {
        setLoading(false);
      }
    };

    if (cursoId) {
      fetchDashboard();
    }
  }, [cursoId, token]);

  const renderBadge = (balance) => {
    switch (balance) {
      case 'ÓPTIMO':
        return <span className="badge badge-optimo">Òptim</span>;
      case 'ACEPTABLE':
        return <span className="badge badge-aceptable">Acceptable</span>;
      case 'DESEQUILIBRADO':
        return (
          <span className="badge badge-desequilibrado">Desequilibrat</span>
        );
      default:
        return <span className="badge badge-default">Sense dades</span>;
    }
  };
  const scatterData =
    dashboardData?.equipos.map((equipo) => ({
      nombre: equipo.nombreEquipo,
      progresoTaiga: equipo.taiga.progressPercentage,
      commits: equipo.github.totalCommits,
      balance: equipo.balanceInterno,
    })) || [];

  // Asignar colores según el estado
  const getColorByBalance = (balance) => {
    switch (balance) {
      case 'ÓPTIMO':
        return '#2b7a2b'; // Verde
      case 'ACEPTABLE':
        return '#d69e2e'; // Naranja/Amarillo
      case 'DESEQUILIBRADO':
        return '#e53e3e'; // Rojo
      default:
        return '#64748b'; // Gris
    }
  };
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.nombre}</p>
          <p className="tooltip-text">Taiga: {data.progresoTaiga}%</p>
          <p className="tooltip-text">Commits: {data.commits}</p>
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <div className="loading-container">
        <p className="loading-text">Carregant dades dels equips...</p>
      </div>
    );

  if (error) return <div className="error-message">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="comparative-dashboard">
      <Sidebar />
      <div className="metrics-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          Torna enrere
        </button>
        <h1 className="page-title">Vista Comparativa d&apos;Equips</h1>

        {/* Targetes de Mètriques Globals */}
        {dashboardData.globales && (
          <div className="metrics-grid">
            <div className="metric-card">
              <h3 className="metric-title">Commits Totals (Projecte)</h3>
              <p className="metric-value">
                {dashboardData.globales.totalCommitsProyecto}
              </p>
            </div>
            <div className="metric-card">
              <h3 className="metric-title">Story Points Completats</h3>
              <p className="metric-value">
                {dashboardData.globales.totalSpCompletadosProyecto}
              </p>
            </div>
          </div>
        )}

        {/* Taula Principal d'Equips */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="comparative-table">
              <thead>
                <tr>
                  <th>Equip</th>
                  <th>Progrés Taiga (SP)</th>
                  <th>Commits GitHub</th>
                  <th>PRs Fusionats</th>
                  <th>Balanç Intern</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.equipos.map((equipo) => (
                  <tr key={equipo.equipoId}>
                    <td className="team-name">{equipo.nombreEquipo}</td>
                    <td>
                      <div className="progress-cell">
                        <span className="progress-text">
                          {equipo.taiga.completedStoryPoints} /{' '}
                          {equipo.taiga.totalStoryPoints}
                        </span>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${equipo.taiga.progressPercentage}%`,
                            }}
                          ></div>
                        </div>
                        <span className="progress-percentage">
                          {equipo.taiga.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td>{equipo.github.totalCommits}</td>
                    <td>{equipo.github.mergedPullRequests}</td>
                    <td>{renderBadge(equipo.balanceInterno)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Gráfico de Dispersión */}
        <div className="card chart-card">
          <h2 className="chart-title">
            Correlació: Progrés Taiga vs Commits GitHub
          </h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  type="number"
                  dataKey="progresoTaiga"
                  name="Progrés Taiga"
                  unit="%"
                  domain={[0, 100]}
                  label={{
                    value: 'Progrés Taiga (%)',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#64748b',
                  }}
                  tick={{ fill: '#64748b' }}
                />

                <YAxis
                  type="number"
                  dataKey="commits"
                  name="Commits"
                  label={{
                    value: 'Commits GitHub',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                  }}
                  tick={{ fill: '#64748b' }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ strokeDasharray: '3 3' }}
                />

                <Scatter name="Equips" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColorByBalance(entry.balance)}
                      r={8}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda del gráfico */}
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot legend-optimo"></span> Òptim
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-aceptable"></span> Acceptable
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-desequilibrado"></span>{' '}
              Desequilibrat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparativaEquipos;
