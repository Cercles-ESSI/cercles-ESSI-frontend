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
    '#7FA7C4', // Azul cielo
    '#88BFA8', // Verde menta
    '#E9A27F', // Melocotón
    '#C78FA5', // Rosa malva
    '#69B3B0', // Turquesa
    '#9A91C4', // Lavanda
    '#E3B85C', // Mostaza
    '#D77C72', // Coral
    '#91B28C', // Salvia
    '#B4936A', // Ocre
    '#E7D58B', // Vainilla
    '#AEBBB5', // Gris verdoso
    '#D99B76', // Terracota
    '#A99ACB', // Lila
    '#D69AA8', // Rosa empolvado
    '#7FA9AA',
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

  const handleBackClick = () => {
    navigate(-1);
  };
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
        <button className="back-button" onClick={handleBackClick}>
          Torna enrere
        </button>
        <div className="dashboard-card">
          {/* CABECERA */}
          <div className="dashboard-header">
            <h1>Anàlisi del historial de mètriques</h1>
            <p>Explorar com evoluciona cada estudiant durant els sprints</p>
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
              <label>Desde</label>
              <input type="date" className="filter-input" />
            </div>
            <div className="filter-group">
              <label>Fins a</label>
              <input type="date" className="filter-input" />
            </div>
            <div className="filter-group">
              <label>Estudiant</label>
              <select className="filter-input">
                <option>Tots els usuaris</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Metrica</label>
              <select className="filter-input">
                <option>Totes les mètriques</option>
              </select>
            </div>
            <button className="clear-btn">Esborrar filtres</button>
          </div>

          {/* CUADRÍCULA DE GRÁFICOS */}
          {datosHistoricos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              Encara no hi ha dades històriques.
            </div>
          ) : (
            <div className="charts-grid">
              <TrendChartCard
                title="Tasques tancades"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="tareasCerradas"
                colores={COLORES_LINEAS}
              />
              <TrendChartCard
                title="Punts d'Esforç (SP)"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="storyPoints"
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
                title="Líneas modificades"
                datos={datosHistoricos}
                estudiantes={estudiantes}
                dataKeyPadre="lineasModificadas"
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
  isPercentage = false, // Nueva propiedad con valor por defecto false
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

          {/* Eje Y dinámico: Solo aplica % y dominio [0,100] si isPercentage es true */}
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={isPercentage ? (value) => `${value}%` : undefined}
            domain={isPercentage ? [0, 100] : ['auto', 'auto']}
          />

          {/* Tooltip dinámico */}
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            }}
            formatter={isPercentage ? (value) => [`${value}%`] : undefined}
          />

          <Legend
            verticalAlign="top"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }}
          />

          {estudiantes.map((nombre, index) => (
            <Line
              key={nombre}
              type="monotone"
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
