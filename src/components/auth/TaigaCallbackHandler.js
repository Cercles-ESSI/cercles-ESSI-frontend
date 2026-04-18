import { useEffect } from 'react';
import { conectarTaiga } from '../../services/Taiga_Api';

const TaigaCallbackHandler = ({
  authType,
  username,
  password,
  onSuccess,
  onError,
}) => {
  useEffect(() => {
    const handleTaigaAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('code');
      const intent = sessionStorage.getItem('authIntent');
      try {
        let currentAuthType = authType;
        let credentials = {};
        if (urlCode && intent === 'taiga') {
          currentAuthType = 'github';
          credentials = { code: urlCode };
        } else if (authType === 'normal') {
          credentials = { username, password };
        }

        if (
          (currentAuthType === 'normal' && (!username || !password)) ||
          (currentAuthType === 'github' && !credentials.code)
        ) {
          return;
        }

        await conectarTaiga(currentAuthType, credentials);
        onSuccess('Compte de Taiga connectada correctament.');

        if (currentAuthType === 'github') {
          sessionStorage.removeItem('authIntent'); // Borramos la nota
        }
        const newUrl = window.location.href.split('?')[0];
        window.history.replaceState(null, '', newUrl);
      } catch (error) {
        console.error('Error al conectar a Taiga:', error);
        onError(error.message || 'Error al conectar a Taiga.');

        if (urlCode && intent === 'taiga') {
          sessionStorage.removeItem('authIntent');
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }
    };

    handleTaigaAuth();
  }, [authType, username, password, onSuccess, onError]);

  return null;
};

export default TaigaCallbackHandler;
