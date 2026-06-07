import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getIdsEvaluaciones,
  getMisAutoEvaluaciones,
} from '../../services/Evaluaciones_Api';
import { getEquipoDetalle } from '../../services/Equipos_Api';
import { obtenerDatosUsuario } from '../../services/Usuarios_Api';
import Sidebar from '../../components/common/Sidebar';
import './MisEvaluacionesPage.css';

const MisEvaluacionesPage = () => {
  const { equipoId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('jwtToken');

  const [equipo, setEquipo] = useState(null);
  const [misAutoEvaluaciones, setMisAutoEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);

        const equipoData = await getEquipoDetalle(equipoId, token);
        setEquipo(equipoData);

        const usuarioActual = await obtenerDatosUsuario(token);

        const miPerfilEnElEquipo = equipoData.estudiantes.find(
          (est) =>
            est.nombre.includes(usuarioActual.nombre) ||
            usuarioActual.nombre.includes(est.nombre),
        );

        const estudianteIdActual =
          usuarioActual.id || usuarioActual.idUsuario || miPerfilEnElEquipo?.id;

        if (!estudianteIdActual) {
          throw new Error(
            "No s'ha pogut trobar la teva ID dins d'aquest equip.",
          );
        }

        console.log('¡ID encontrada con éxito! ->', estudianteIdActual);

        const evaluacionesIds = await getIdsEvaluaciones(
          equipoData.cursoId,
          token,
        );

        if (evaluacionesIds.length > 0) {
          // 4. Llamada al endpoint usando tu archivo centralizado de API
          const notasBackend = await getMisAutoEvaluaciones(
            equipoId,
            estudianteIdActual,
            token,
          );

          // 5. Mapeamos los datos para la tabla
          const autoEvaluacionesExtraidas = notasBackend.map((nota) => {
            const posicionReal = evaluacionesIds.indexOf(nota.evaluacionId);

            return {
              numeroEvaluacion:
                posicionReal !== -1 ? posicionReal + 1 : 'Extra',
              evaluacionId: nota.evaluacionId,
              nota: nota.puntuacion || nota.puntos,
            };
          });
          autoEvaluacionesExtraidas.sort(
            (a, b) => a.numeroEvaluacion - b.numeroEvaluacion,
          );

          setMisAutoEvaluaciones(autoEvaluacionesExtraidas);
        }
      } catch (err) {
        console.error(err);
        setError('Error al carregar les teves autoavaluacions.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [equipoId, token]);

  const handleBackClick = () => {
    navigate(`/equipos/${equipoId}`);
  };

  if (loading)
    return <p className="loading-text">Carregant les teves dades...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="evaluaciones-personal-page">
      <Sidebar />
      <div className="evaluacion-personal-content">
        <button className="back-button" onClick={handleBackClick}>
          Torna enrere
        </button>

        <h1>La meva Autoavaluació</h1>
        <h2>Equip: {equipo?.nombre}</h2>

        <div className="card-personal">
          <h3>El teu registre de notes</h3>
          <p className="descripcion">
            Aquesta taula mostra exclusivament les notes que t&apos;has assignat
            a tu mateix/a en les diferents fases d&apos;avaluació del projecte.
          </p>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fase d&apos;Avaluació</th>
                  <th className="mitjana-column">
                    La teva nota (Autoavaluació)
                  </th>
                </tr>
              </thead>
              <tbody>
                {misAutoEvaluaciones.length > 0 ? (
                  misAutoEvaluaciones.map((evaluacion) => (
                    <tr key={`autoeval-${evaluacion.evaluacionId}`}>
                      <td>Avaluació {evaluacion.numeroEvaluacion}</td>
                      <td
                        className="mitjana-column"
                        style={{
                          fontWeight: 'bold',
                          color: evaluacion.nota ? '#2c3e50' : '#94a3b8',
                        }}
                      >
                        {evaluacion.nota !== null &&
                        evaluacion.nota !== undefined
                          ? evaluacion.nota.toFixed(2)
                          : 'Sense avaluar'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">
                      Encara no hi ha dades d&apos;autoavaluació registrades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisEvaluacionesPage;
