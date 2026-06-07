import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistoricoEquipo } from '../../services/Evaluaciones_Api';
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
    '#6c9975',
    '#2c3e50',
    '#d97706',
    '#0284c7',
    '#7c3aed',
    '#db2777',
    '#ea580c',
    '#14b8a6',
  ];

  useEffect(() => {
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
    <div
      style={{
        display: 'flex',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        paddingLeft: '260px',
      }}
    >
      <Sidebar />
      <div style={{ width: '100%', padding: '40px', boxSizing: 'border-box' }}>
        <button
          onClick={() => navigate(`/equipos/${equipoId}`)}
          style={btnStyle}
        >
          &larr; Tornar a l'Equip
        </button>

        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <h1 style={{ color: '#1e293b', marginTop: 0, marginBottom: '10px' }}>
            Historical Trend Analysis
          </h1>
          <h3 style={{ color: '#64748b', marginTop: 0, fontWeight: 'normal' }}>
            Equip: <strong>{equipo?.nombre}</strong>
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Aquesta vista mostra l'evolució de l'esforç i la participació dels
            estudiants al llarg de les iteracions avaluades.
          </p>
        </div>

        {datosHistoricos.length === 0 ? (
          <div
            style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p>Encara no hi ha dades històriques per a aquest equip.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: '25px',
            }}
          >
            {/* GRÁFICO 1: Tareas Cerradas */}
            <ChartCard
              titulo="Tasques Tancades a Taiga"
              datos={datosHistoricos}
              estudiantes={estudiantes}
              dataKeyPadre="tareasCerradas"
              colores={COLORES_LINEAS}
            />

            {/* GRÁFICO 2: Story Points */}
            <ChartCard
              titulo="Punts d'Esforç (Story Points) Completats"
              datos={datosHistoricos}
              estudiantes={estudiantes}
              dataKeyPadre="storyPoints"
              colores={COLORES_LINEAS}
            />

            {/* GRÁFICO 3: Commits Github */}
            <ChartCard
              titulo="Commits a GitHub"
              datos={datosHistoricos}
              estudiantes={estudiantes}
              dataKeyPadre="commitsRealizados"
              colores={COLORES_LINEAS}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({ titulo, datos, estudiantes, dataKeyPadre, colores }) => {
  const datosPlanos = datos.map((item) => {
    const iteracionData = { iteracion: item.iteracion };
    if (item[dataKeyPadre]) {
      Object.keys(item[dataKeyPadre]).forEach((estudiante) => {
        iteracionData[estudiante] = item[dataKeyPadre][estudiante];
      });
    }
    return iteracionData;
  });

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      <h3
        style={{
          textAlign: 'center',
          color: '#334155',
          marginBottom: '25px',
          fontSize: '1.1rem',
        }}
      >
        {titulo}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={datosPlanos}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="iteracion"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickMargin={15}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
          />

          {estudiantes.map((nombre, index) => (
            <Line
              key={nombre}
              type="monotone"
              dataKey={nombre}
              name={nombre}
              stroke={colores[index % colores.length]}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const btnStyle = {
  marginBottom: '20px',
  padding: '8px 16px',
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500',
};

export default EquipoMetricsHistory;
