import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistoricoEquipo } from '../../services/Historico_Api';
import { getEquipoDetalle } from '../../services/Equipos_Api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Sidebar from '../../components/common/Sidebar';
import './EquipoMetricsHistory.css';

const EquipoMetricsHistory = () => {
  const { equipoId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('jwtToken');

  const [equipo, setEquipo] = useState(null);
  const [datosHistoricos, setDatosHistoricos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORES_LINEAS = [
    '#84cc16', // Verde claro
    '#3b82f6', // Azul
    '#f97316', // Naranja
    '#06b6d4', // Cyan
    '#8b5cf6', // Morado
    '#ef4444', // Rojo
  ];

  useEffect(() => {
    if (!token) {
      setError('Sessió no vàlida.');
      setLoading(false);
      return;
    }

    const fetchDatos = async () => {
      try {
        setLoading(true);
        const [equipoData, historicoBackend] = await Promise.all([
          getEquipoDetalle(equipoId, token),
          getHistoricoEquipo(equipoId, token),
        ]);

        setEquipo(equipoData);

        if (historicoBackend.length > 0) {
          const nombres = Object.keys(historicoBackend[0].tareasCerradas || {});
          setEstudiantes(nombres);
        }

        setDatosHistoricos(historicoBackend);
      } catch (err) {
        console.error(err);
        setError('Error al carregar les dades històriques.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [equipoId, token]);

  if (loading)
    return (
      <p style={{ padding: '40px', marginLeft: '260px' }}>
        Carregant el dashboard analític...
      </p>
    );
  if (error)
    return (
      <p style={{ padding: '40px', marginLeft: '260px', color: 'red' }}>
        {error}
      </p>
    );

  return (
    <div className="historical-page">
      <Sidebar />
      <div className="historical-content">
        {/* PESTAÑAS SUPERIORES */}
        <div className="top-tabs">
          <button
            className="tab-button"
            onClick={() => navigate(`/equipo/${equipoId}/datos_generales`)}
          >
            Overview
          </button>
          <button className="tab-button active">Historical</button>
        </div>

        <div className="dashboard-card">
          {/* CABECERA */}
          <div className="dashboard-header">
            <h1>Historical trend analysis</h1>
            <p>Explore how each student evolves across key metrics.</p>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="filters-bar">
            <div className="filter-group">
              <label>Sprint</label>
              <select className="filter-input">
                <option>Global</option>
              </select>
            </div>
            <div className="filter-group">
              <label>From</label>
              <input type="date" className="filter-input" />
            </div>
            <div className="filter-group">
              <label>To</label>
              <input type="date" className="filter-input" />
            </div>
            <div className="filter-group">
              <label>Student</label>
              <select className="filter-input">
                <option>All users</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Metric</label>
              <select className="filter-input">
                <option>All metrics</option>
              </select>
            </div>
            <button className="clear-btn">Clear Filters</button>
          </div>

          {/* CUADRÍCULA DE GRÁFICOS */}
          {datosHistoricos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              Encara no hi ha dades històriques.
            </div>
          ) : (
            <div className="charts-grid">
              <TrendChartCard
                title="Closed Tasks"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="tareasCerradas"
                colores={COLORES_LINEAS}
              />
              <TrendChartCard
                title="Commits"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="commitsRealizados"
                colores={COLORES_LINEAS}
              />
              <TrendChartCard
                title="Modified Lines"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="lineasModificadas"
                colores={COLORES_LINEAS}
              />
              <TrendChartCard
                title="Tasks"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="storyPoints"
                colores={COLORES_LINEAS}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TrendChartCard = ({
  title,
  datos,
  estudiantes,
  dataKeyPadre,
  colores,
}) => {
  const datosPlanos = datos.map((item) => {
    const iteracionData = { name: item.fechaGuardado || item.iteracion };
    if (item[dataKeyPadre]) {
      Object.keys(item[dataKeyPadre]).forEach((estudiante) => {
        iteracionData[estudiante] = item[dataKeyPadre][estudiante];
      });
    }
    return iteracionData;
  });

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={datosPlanos}
          margin={{ top: 20, right: 10, left: -20, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />

          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            tickMargin={10}
          />

          {/* Eje Y con formato de porcentaje (0% a 100%) */}
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />

          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            }}
            formatter={(value) => [`${value}%`]}
          />

          {/* Leyenda arriba del todo */}
          <Legend
            verticalAlign="top"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }}
          />

          {estudiantes.map((nombre, index) => (
            <Line
              key={nombre}
              type="monotone" // Líneas suaves
              dataKey={nombre}
              name={nombre}
              stroke={colores[index % colores.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquipoMetricsHistory;
