import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/common/Sidebar';
import githubLogo from '../../assets/images/github-logo-920x460-sue-v1.png';
import userProfile from '../../assets/images/user-profile.png';
import GitHubCallbackHandler from '../../components/auth/GitHubCallbackHandler';
import {
  obtenerDatosGitHub,
  desconectarGitHub,
} from '../../services/Github_Api';
import { obtenerDatosUsuario } from '../../services/Usuarios_Api';
import './PerfilPage.css';

const PerfilPage = () => {
  const [gitUsername, setGitUsername] = useState(null);
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  const fetchUserData = useCallback(() => {
    setLoading(true);
    obtenerDatosUsuario()
      .then((data) => {
        setNombre(data.nombre);
        setGitUsername(data.gitUsername);
        setErrorMessage(null);
        if (data.gitUsername) {
          fetchGitHubData();
        }
      })
      .catch(() => setErrorMessage('Error en carregar les dades.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchGitHubData = () => {
    obtenerDatosGitHub()
      .then((data) => setGithubData(data))
      .catch(() => setErrorMessage('Error en carregar les dades.'));
  };

  const handleGitHubConnect = () => {
    sessionStorage.setItem('authIntent', 'github_app');
    const clientId = 'Ov23liXUUdsk0qec5bBU';
    const redirectUri = 'http://localhost:3000/perfil';
    const scope = 'repo user';
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&prompt=login`;

    window.location.href = githubAuthUrl;
  };

  const handleGitHubDisconnect = () => {
    if (
      window.confirm('Estàs segur/a de voler desconnectar el compte de GitHub?')
    ) {
      desconectarGitHub()
        .then(() => {
          alert('Compte de GitHub desconnectada correctament.');
          setGitUsername(null);
          setGithubData(null);
        })
        .catch(() =>
          setErrorMessage('Error al desconnectar el compte de GitHub.'),
        );
    }
  };

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="perfil-page">
      <GitHubCallbackHandler onGitHubConnected={fetchUserData} />

      <Sidebar />
      <div className="content">
        <h1>PERFIL</h1>
        <p>
          Aquesta és la pàgina principal del perfil de <strong>{nombre}</strong>
        </p>

        {/* Mensajes de éxito y error */}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <div className="connections-container">
          {/* GitHub Connection */}
          <div className="github-connection-box">
            {gitUsername ? (
              <div className="github-info">
                <h2>Compte de GitHub associat</h2>
                <p>
                  El compte de GitHub associat al teu perfil és:{' '}
                  <a
                    href={`https://github.com/${gitUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                  >
                    {gitUsername}
                  </a>
                </p>
                {githubData && (
                  <div className="github-details">
                    <p
                      className="expandable-item"
                      onClick={() => toggleSection('repositoriosPublicos')}
                      aria-expanded={expandedSection === 'repositoriosPublicos'}
                    >
                      <strong>Repositoris públics: </strong>{' '}
                      {
                        githubData.repositorios.filter((repo) => !repo.private)
                          .length
                      }
                      <span className="arrow" aria-hidden="true">
                        ▶
                      </span>
                    </p>

                    <p
                      className="expandable-item"
                      onClick={() => toggleSection('repositoriosPrivados')}
                      aria-expanded={expandedSection === 'repositoriosPrivados'}
                    >
                      <strong>Repositoris privats: </strong>{' '}
                      {
                        githubData.repositorios.filter((repo) => repo.private)
                          .length
                      }
                      <span className="arrow" aria-hidden="true">
                        ▶
                      </span>
                    </p>

                    <p
                      className="expandable-item"
                      onClick={() => toggleSection('organizaciones')}
                      aria-expanded={expandedSection === 'organizaciones'}
                    >
                      <strong>Organitzacions: </strong>{' '}
                      {githubData.organizaciones.length}
                      <span className="arrow" aria-hidden="true">
                        ▶
                      </span>
                    </p>
                  </div>
                )}

                <button
                  className="disconnect-button"
                  onClick={handleGitHubDisconnect}
                >
                  Desconnecta el compte de GitHub
                </button>
              </div>
            ) : (
              <div>
                <p>
                  Per connectar el teu compte de <strong>GitHub</strong> amb{' '}
                  <strong>CERCLES</strong>, fes clic al botó següent. Aquesta
                  connexió permetrà associar el teu compte de GitHub amb el teu
                  perfil dins l&apos;aplicació, proporcionant accés a les dades
                  dels teus repositoris i organitzacions.{' '}
                  <strong>
                    Tingues en compte que, si ja tens una sessió activa a
                    GitHub, CERCLES s&apos;associarà automàticament a aquesta.
                  </strong>{' '}
                  Si vols associar CERCLES amb un compte diferent,
                  assegura&apos;t de tancar la sessió a GitHub abans de
                  continuar.
                </p>

                <button
                  className="github-connect-button"
                  onClick={handleGitHubConnect}
                >
                  Connecta amb GitHub
                </button>
              </div>
            )}
          </div>
          {/* Caja secundaria: Detalles expandibles */}
          {expandedSection && githubData && (
            <div className="expanded-details-box">
              <h2>
                {expandedSection === 'repositoriosPublicos'
                  ? 'Repositoris públics'
                  : expandedSection === 'repositoriosPrivados'
                    ? 'Repositoris privats'
                    : 'Organitzacions'}
              </h2>
              <ul>
                {expandedSection === 'repositoriosPublicos' &&
                  githubData.repositorios
                    .filter((repo) => !repo.private)
                    .map((repo) => <li key={repo.id}>{repo.name}</li>)}

                {expandedSection === 'repositoriosPrivados' &&
                  githubData.repositorios
                    .filter((repo) => repo.private)
                    .map((repo) => <li key={repo.id}>{repo.name}</li>)}

                {expandedSection === 'organizaciones' &&
                  githubData.organizaciones.map((org) => (
                    <li key={org.id}>{org.login}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
        <div className="profile-images-container">
          <img
            src={userProfile}
            alt="Home Welcome"
            className="profile-images1"
          />
          <img src={githubLogo} alt="GitHub Logo" className="profile-images2" />
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;
