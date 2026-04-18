import React, { useState } from 'react';
import './LoginPage.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [fadeOut, setFadeOut] = useState(false);

  const handleLoginSuccess = (credentialResponse) => {
    const googleToken = credentialResponse.credential;
    const payload = JSON.parse(atob(googleToken.split('.')[1]));
    const email = payload.email;

    // Llamada al backend para verificar si el usuario existe y obtener el JWT
    fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googleToken }),
    })
      .then((response) => {
        console.log('Respuesta del backend:', response);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Respuesta del backend:', data);
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('id', data.id);
        navigate('/home');
      })
      .catch((error) => {
        console.log('Error:', error);
        setErrorMessage(
          'El correu introduit no pertany a cap usuari registrat a CERCLES.',
        );
      });
  };

  const handleLoginFailure = (error) => {
    console.error('Login failed', error);
    setErrorMessage("S'ha produït un error durant l'inici de sessió.");
  };

  return (
    <GoogleOAuthProvider clientId="116542465790-12ggck24umtgna96oo0i0kdgd0n4435j.apps.googleusercontent.com">
      <div className="login-page">
        <div className="login-box">
          <h1>CERCLES</h1>
          <p>
            <strong>C</strong>reació d&apos;<strong>E</strong>quips i seguiment
            del <strong>R</strong>endiment i <strong>C</strong>o
            <strong>L</strong>·laboracio en projectes d&apos;<strong>E</strong>
            nginyeria del
            <strong> S</strong>oftware
          </p>
          <p>Inicia sessió amb el teu compte de la UPC per continuar</p>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="google-login">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginFailure}
              text="Inicia sessió amb Google"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
