const API_BASE_URL = 'http://localhost:8080/api/evaluaciones';

// Obtener evaluaciones detalle
export const getEvaluacionesDetalle = async (
  equipoId,
  token,
  evaluacionIds,
) => {
  try {
    const params = new URLSearchParams({
      evaluacionIds: evaluacionIds.join(','),
    });

    console.log('params ', params);

    const response = await fetch(
      `${API_BASE_URL}/equipo/${equipoId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Error al obtener los detalles del equipo.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener los detalles del equipo:', error);
    throw error;
  }
};

// Obtener evaluaciones por equipo
export const getEvaluacionesPorEquipo = async (equipoId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipo/${equipoId}/medias`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Error al obtener las evaluaciones del equipo.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener las evaluaciones del equipo:', error);
    throw error;
  }
};

// Comprobar si la evaluación está activa
export const isEvaluacionActiva = async (equipoId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/equipo/${equipoId}/evaluacion-activa`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Error al comprobar si la evaluación está activa.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error al comprobar si la evaluación está activa:', error);
    throw error;
  }
};

// Comprobar si la evaluación ya fue realizada
export const isEvaluacionRealizada = async (
  estudianteId,
  evaluacionId,
  token,
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/equipo/evaluacion-realizada/${evaluacionId}/${estudianteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          'Error al comprobar si la evaluación ya fue realizada.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      'Error al comprobar si la evaluación ya fue realizada:',
      error,
    );
    throw error;
  }
};

export const crearEvaluacionDetalle = async (
  evaluacionId,
  evaluadorId,
  detalles,
  token,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiante/crear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evaluacionId,
        evaluadorId,
        detalles,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Error al crear la evaluación: ${response.status} - ${errorData}`,
      );
    }

    return await response.text();
  } catch (error) {
    console.error('Error al crear la evaluación:', error);
    throw error;
  }
};

export const getEvaluacionActivaId = async (equipoId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/equipo/${equipoId}/evaluacion-activa-id`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener la evaluación activa.');
    }

    return await response.json(); // Devuelve el evaluacionId
  } catch (error) {
    console.error('Error al obtener la evaluación activa:', error);
    throw error;
  }
};

// Get IDs de evaluaciones de un curso
export const getIdsEvaluaciones = async (cursoId, token) => {
  const response = await fetch(`${API_BASE_URL}/count/${cursoId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener los IDs de las evaluaciones');
  }

  const data = await response.json();
  return data.idsEvaluaciones; // Devuelve la lista de IDs
};

// Obtener las autoevaluaciones de un estudiante específico
export const getMisAutoEvaluaciones = async (equipoId, estudianteId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/equipo/${equipoId}/autoevaluacion/${estudianteId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      let errorMessage = 'Error al obtenir les autoevaluacions.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtenir les autoevaluacions:', error);
    throw error;
  }
};
