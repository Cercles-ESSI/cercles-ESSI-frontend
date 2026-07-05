const API_BASE_URL = 'http://localhost:8080/api/historial';

export const getHistoricoEquipo = async (equipoId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/equipo/${equipoId}/historico`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtenir les dades històriques del servidor.');
    }

    return await response.json();
  } catch (error) {
    console.error("Error al obtenir l'històric:", error);
    throw error;
  }
};
