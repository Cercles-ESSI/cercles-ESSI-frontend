import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import './HomePage.css';
import homeImage from '../../assets/images/homeImage.jpg';
import { obtenerDatosUsuario } from '../../services/Usuarios_Api.js';

const HomePage = () => {
  const [rol, setRol] = useState(null);
  const [userData, setUserData] = useState({
    nombre: '',
    gitUsername: null,
    //taigaUsername: null,
  });

  useEffect(() => {
    const userRol = localStorage.getItem('rol');
    setRol(userRol);

    obtenerDatosUsuario()
      .then((data) => setUserData(data))
      .catch((error) =>
        console.error('Error al obtener datos del usuario:', error),
      );
  }, []);

  const handleNavigateToProfile = () => {
    window.location.href = '/perfil';
  };

  const handleNavigateToCourses = () => {
    window.location.href = '/cursos';
  };

  const handleNavigateToProjects = () => {
    window.location.href = '/equipos';
  };

  if (!rol || !userData.nombre) {
    return <p>Càrregant...</p>;
  }

  return (
    <div className="home-page">
      <Sidebar />
      <div className="content">
        <div className="welcome-section">
          <div className="welcome-content">
            <img src={homeImage} alt="Home Welcome" className="home-image" />
            <div className="welcome-text">
              <h1>
                Benvingut/da,{' '}
                <span className="user-name">{userData.nombre}</span>
              </h1>
              {rol === 'Estudiante' && (
                <h2>
                  Aquesta és la pàgina principal després d&apos;iniciar sessió.
                  Pots accedir al teu perfil per configurar el teu compte de
                  Github o explorar els teus equips.
                </h2>
              )}
              {rol === 'Profesor' && (
                <h2>
                  Aquesta és la pàgina principal després d&apos;iniciar sessió.
                  Pots gestionar els teus cursos, els seus estudiants, o accedir
                  al teu perfil per configurar el teu compte de Github.
                </h2>
              )}
              {userData.gitUsername === null && (
                <div className="config-reminders">
                  <p className="reminder-text">
                    ⚠️ Encara no has configurat el teu compte de{' '}
                    <strong>GitHub</strong>. Ves a la pàgina de Perfil per fer
                    la configuració.
                  </p>
                </div>
              )}

              <div className="button-container">
                <button
                  className="navigate-button"
                  onClick={handleNavigateToProfile}
                >
                  Accedir al Perfil
                </button>
                {rol === 'Estudiante' ? (
                  <button
                    className="navigate-button"
                    onClick={handleNavigateToProjects}
                  >
                    Veure Equips
                  </button>
                ) : (
                  <button
                    className="navigate-button"
                    onClick={handleNavigateToCourses}
                  >
                    Veure Cursos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
