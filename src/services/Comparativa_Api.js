const API_BASE_URL = 'http://localhost:8080/api';
const obtenerToken = () => localStorage.getItem('jwtToken');

export const getComparativaMetrics = async (cursoId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/comparativa/comparativa-equips/${cursoId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "No s'han pogut carregar les estadístiques per als equips.",
    );
  }

  return await response.json(); // Devuelve true si todo ha ido bien
};
