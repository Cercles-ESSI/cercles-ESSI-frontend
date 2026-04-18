const API_BASE_URL = 'http://localhost:8080/api';

// Obtener todos los equipos del usuario autenticado
export const getEquiposDeUsuario = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}/equipos`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error en la solicitud');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener los equipos del usuario:', error);
    throw error;
  }
};

//obtener detalle de un equipo
export const getEquipoDetalle = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipos/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los detalles del equipo.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener los detalles del equipo:', error);
    throw error;
  }
};

// Obtener los cursos de un estudiante
export const getCursosDeEstudiante = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}/cursos`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Error al obtener los cursos del estudiante.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener los cursos del estudiante:', error.message);
    throw error;
  }
};

// Obtener los estudiantes de un curso
export const getEstudiantesCurso = async (cursoId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cursos/${cursoId}/estudiantes`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Error al obtener los estudiantes del curso.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener los estudiantes del curso:', error.message);
    throw error;
  }
};

// Obtener los profesores de un curso
export const getProfesoresCurso = async (cursoId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cursos/${cursoId}/profesores`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Error al obtener los profesores del curso.',
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener los profesores del curso:', error.message);
    throw error;
  }
};

// Crear un nuevo equipo
export const crearEquipo = async (equipoData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipos/crear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(equipoData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Error al crear el equipo.');
    }

    const successMessage = await response.text();
    console.log('Response:', successMessage);

    return successMessage;
  } catch (error) {
    console.error('Error al crear el equipo:', error.message);
    throw error;
  }
};

// Borrar un equipo
export const borrarEquipo = async (equipoId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipos/${equipoId}/borrar`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al borrar el equipo.');
    }
  } catch (error) {
    console.error('Error al borrar el equipo:', error.message);
    throw error;
  }
};

// Salir de un equipo
export const salirEquipo = async (equipoId, estudianteId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipos/${equipoId}/salir`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estudianteId }),
    });

    if (!response.ok) {
      throw new Error('Error al salir del equipo.');
    }
  } catch (error) {
    console.error('Error al salir del equipo:', error.message);
    throw error;
  }
};

//añadir miembros a un equipo
export const añadirMiembros = async (equipoId, data, token) => {
  const response = await fetch(
    `${API_BASE_URL}/equipos/${equipoId}/add_member`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error('Error al añadir miembros al equipo.');
  }
};

//borrar miembros de un equipo
export const borrarMiembros = async (equipoId, data, token) => {
  const response = await fetch(
    `${API_BASE_URL}/equipos/${equipoId}/borrar_miembros`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error('Error al borrar miembros del equipo.');
  }
};

//validar org
export const validarOrganizacion = async (
  profesorId,
  miembrosIds,
  organizacionUrl,
  githubAsignatura,
  tokenGithub,
  token,
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/github/validar-organizacion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profesorId,
          miembrosIds,
          organizacionUrl,
          githubAsignatura,
          tokenGithub,
        }),
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al validar la organización.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al validar la organización:', error);
    throw new Error(
      error.message || 'Error desconocido al validar la organización.',
    );
  }
};

//confirmar en bd org
export const confirmarOrganizacion = async (
  equipoId,
  organizacionUrl,
  token,
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/github/confirmar-organizacion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipoId,
          organizacionUrl,
        }),
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al confirmar la organización.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al confirmar la organización:', error);
    throw new Error(
      error.message || 'Error desconocido al confirmar la organización.',
    );
  }
};

// validar proyecto
export const validarProyecto = async (
  profesorId,
  miembrosIds,
  proyectoUrl,
  profesorTaiga,
  token,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/taiga/validar-proyecto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        profesorId,
        miembrosIds,
        proyectoUrl,
        profesorTaiga,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al validar el proyecto.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al validar el proyecto:', error);
    throw new Error(
      error.message || 'Error desconocido al validar el proyecto.',
    );
  }
};

//confirmar en bd prj
export const confirmarProyecto = async (equipoId, proyectoUrl, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/taiga/confirmar-proyecto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        equipoId,
        proyectoUrl,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al confirmar el proyecto.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al confirmar el proyecto:', error);
    throw new Error(
      error.message || 'Error desconocido al confirmar el proyecto.',
    );
  }
};

// Obtener métricas del equipo
// Obtener métricas del equipo
export const getMetrics = async (org, estudiantesIds, idEquipo, token) => {
  if (!org || !estudiantesIds?.length || !idEquipo) {
    throw new Error('Faltan parámetros necesarios.');
  }

  const queryParams = `estudiantesIds=${estudiantesIds.join('&estudiantesIds=')}`;
  const url = `${API_BASE_URL}/github/equipo/${idEquipo}/metrics/${org}?${queryParams}`;
  console.log('url ', url);

  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      return response.json(); // Retorna explícitamente el JSON
    })
    .then((data) => {
      console.log('Datos obtenidos:', data);
      return data; // Asegúrate de retornar los datos aquí
    })
    .catch((error) => {
      console.error('Error en la solicitud:', error);
      throw error; // Re-lanza el error para que se pueda manejar en el `useEffect`
    });
};

//desconectar org de equipo
export const disconnectOrganizacion = async (equipoId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/github/disconnect-organizacion`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ equipoId }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Error al desconnectar la organització: ${response.statusText}`,
    );
  }

  return await response.json();
};

//desconectar prj de equipo
export const disconnectProyecto = async (equipoId, token) => {
  const response = await fetch(`${API_BASE_URL}/taiga/disconnect-proyecto`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ equipoId }),
  });

  if (!response.ok) {
    throw new Error(
      `Error al desconnectar el proyecto: ${response.statusText}`,
    );
  }

  return await response.json();
};
