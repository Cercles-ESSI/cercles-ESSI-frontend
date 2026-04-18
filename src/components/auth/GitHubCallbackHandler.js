import { useEffect } from 'react';
import { conectarGitHub } from '../../services/Github_Api';

const GitHubCallbackHandler = ({ onGitHubConnected }) => {
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    const intent = sessionStorage.getItem('authIntent');
    if (code && intent !== 'taiga') {
      conectarGitHub(code)
        .then((data) => {
          if (data.message === 'Cuenta de GitHub asociada exitosamente') {
            console.log('GitHub connected:', data);
            onGitHubConnected();
            localStorage.setItem('githubCode', code);

            const newUrl = window.location.href.split('?')[0];
            window.history.replaceState(null, '', newUrl);
          } else {
            console.error('Error connecting GitHub:', data);
          }
        })
        .catch((error) => console.error('Error:', error));
    }
  }, [onGitHubConnected]);

  return null;
};

export default GitHubCallbackHandler;
