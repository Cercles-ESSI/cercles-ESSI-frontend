import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import './CrearCurso.css';
import {
  obtenerProfesoresDisponibles,
  subirArchivoEstudiantes,
} from '../../services/Cursos_Api.js';

const CrearCurso = () => {
  const currentYear = new Date().getFullYear();
  const [nombreAsignatura, setNombreAsignatura] = useState('');
  const [añoInicio, setAñoInicio] = useState(currentYear);
  const [cuatrimestre, setCuatrimestre] = useState('1');
  const [selectedProfesores, setSelectedProfesores] = useState([]);
  const [gestiotasques, setGestioTasques] = useState('');
  const [profesoresDisponibles, setProfesoresDisponibles] = useState([]);
  const [estudiantesFile, setEstudiantesFile] = useState(null);
  const [estudiantesData, setEstudiantesData] = useState([]);
  const [numPeriodosEvaluacion, setNumPeriodosEvaluacion] = useState(3);
  const [periodosEvaluacion, setPeriodosEvaluacion] = useState([
    { fechaInicio: '', fechaFin: '' },
    { fechaInicio: '', fechaFin: '' },
    { fechaInicio: '', fechaFin: '' },
  ]);
  const [errorFechas, setErrorFechas] = useState('');
  const [uploadErrors, setUploadErrors] = useState([]);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const idProfesorLoggeado = parseInt(localStorage.getItem('id'));
  const [githubAsignatura, setGithubAsignatura] = useState('');
  const [tokenGithub, setTokenGithub] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfesores = async () => {
      try {
        const profesores = await obtenerProfesoresDisponibles();
        setProfesoresDisponibles(profesores);

        if (profesores.some((prof) => prof.id === idProfesorLoggeado)) {
          setSelectedProfesores((prevSelected) =>
            prevSelected.includes(idProfesorLoggeado)
              ? prevSelected
              : [...prevSelected, idProfesorLoggeado],
          );
        }
      } catch (error) {
        console.error('Error al obtener los profesores:', error);
      }
    };

    fetchProfesores();

    // Cargar datos de location.state
    if (location.state) {
      const {
        nombreAsignatura,
        añoInicio,
        cuatrimestre,
        selectedProfesores,
        periodosEvaluacion,
        numPeriodosEvaluacion,
        githubAsignatura,
      } = location.state;

      setNombreAsignatura(nombreAsignatura || '');
      setAñoInicio(añoInicio || currentYear);
      setCuatrimestre(cuatrimestre || '1');
      setSelectedProfesores(selectedProfesores || []);
      setNumPeriodosEvaluacion(numPeriodosEvaluacion);
      setPeriodosEvaluacion(
        periodosEvaluacion ||
          Array(3).fill({
            fechaInicio: '',
            fechaFin: '',
          }),
      );
      setGithubAsignatura(githubAsignatura);
    }
  }, [location.state, idProfesorLoggeado, currentYear]);

  const handleProfesorClick = (id) => {
    setSelectedProfesores((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((profId) => profId !== id)
        : [...prevSelected, id],
    );
  };

  const handleNumPeriodosChange = (e) => {
    const newNumPeriodos = parseInt(e.target.value, 10);

    setPeriodosEvaluacion((prev) => {
      if (newNumPeriodos > prev.length) {
        return [
          ...prev,
          ...Array(newNumPeriodos - prev.length).fill({
            fechaInicio: '',
            fechaFin: '',
          }),
        ];
      } else if (newNumPeriodos < prev.length) {
        return prev.slice(0, newNumPeriodos);
      }
      return prev;
    });

    setNumPeriodosEvaluacion(newNumPeriodos);
  };

  const handleFechaChange = (index, field, value) => {
    setPeriodosEvaluacion((prev) => {
      const updatedPeriodos = prev.map((periodo, i) =>
        i === index ? { ...periodo, [field]: value } : periodo,
      );

      if (field === 'fechaInicio' && index > 0) {
        const prevPeriodo = updatedPeriodos[index - 1];
        if (new Date(value) < new Date(prevPeriodo.fechaFin)) {
          setErrorFechas(
            `La data d'inici de l'avaluació ${index + 1} ha de ser posterior a la data de fi de l'avaluació ${index}.`,
          );
          return prev;
        } else {
          setErrorFechas('');
        }
      }

      if (field === 'fechaFin' && index >= 0) {
        const currPeriodo = updatedPeriodos[index];
        if (new Date(value) < new Date(currPeriodo.fechaInicio)) {
          setErrorFechas(
            `La data de fi de l'avaluació ${index + 1} ha de ser igual o posterior a la seva data d'inici.`,
          );
          return prev;
        } else {
          setErrorFechas('');
        }
      }

      return updatedPeriodos;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (selectedProfesores.length === 0) {
      alert('Si us plau, selecciona almenys un professor.');
      return;
    }

    if (!estudiantesFile) {
      return;
    }

    try {
      const data = await subirArchivoEstudiantes(estudiantesFile);
      setEstudiantesData(data);
      navigate('/cursos/crear/verificar', {
        state: {
          nombreAsignatura,
          añoInicio,
          cuatrimestre,
          profesores: selectedProfesores.map((id) => {
            const prof = profesoresDisponibles.find((prof) => prof.id === id);
            return { id: prof.id, nombre: prof.nombre, correo: prof.correo };
          }),
          estudiantes: data,
          gestiotasques,
          periodosEvaluacion,
          githubAsignatura,
          tokenGithub,
        },
      });
    } catch (error) {
      console.error('Error completo:', error);

      if (error.response?.errores) {
        console.log('Errores detectados:', error.response.errores);
        setUploadErrors(error.response.errores);
        setShowErrorPopup(true);
      } else {
        console.error('Error inesperado:', error);
      }
    }
  };

  return (
    <div className="cursos-page">
      <Sidebar />
      <div className="create-course-form">
        <h1>Crear un nou curs</h1>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group-curso">
            <label htmlFor="nombreAsignatura">Nom de l&apos;assignatura</label>
            <input
              type="text"
              id="nombreAsignatura"
              value={nombreAsignatura}
              onChange={(e) => setNombreAsignatura(e.target.value)}
              required
            />
          </div>
          <div className="form-group-curso">
            <label htmlFor="añoInicio">Any d&apos;inici</label>
            <select
              id="añoInicio"
              value={añoInicio}
              onChange={(e) => setAñoInicio(parseInt(e.target.value))}
              required
            >
              {Array.from({ length: 5 }, (_, i) => currentYear + i).map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="form-group-curso">
            <label htmlFor="cuatrimestre">Quadrimestre</label>
            <select
              id="cuatrimestre"
              value={cuatrimestre}
              onChange={(e) => setCuatrimestre(e.target.value)}
              required
            >
              <option value="1">Tardor</option>
              <option value="2">Primavera</option>
            </select>
          </div>
          <div className="form-group-curso">
            <label>Selecció de professors</label>
            <div className="profesor-selection-group">
              {profesoresDisponibles.map((profesor) => (
                <div
                  key={profesor.id}
                  className={`profesor-card ${
                    selectedProfesores.includes(profesor.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleProfesorClick(profesor.id)}
                >
                  {profesor.nombre}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group-curso">
            <label htmlFor="estudiantesFile" className="file-label">
              Pujar document excel amb els estudiants{' '}
              <span
                className="tooltip-icon"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                ?
              </span>
              {showTooltip && (
                <div className="tooltip">
                  <p>
                    El fitxer ha de ser un document Excel (.xlsx) amb les dades
                    dels integrants d&apos;aquest nou curs que tingui les
                    següents tres columnes:{' '}
                  </p>
                  <table className="tooltip-table">
                    <thead>
                      <tr>
                        <th>Grup</th>
                        <th>Cognoms, Nom</th>
                        <th>Correu electrònic</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>AMEP1</td>
                        <td>Pérez Martínez, Laura</td>
                        <td>laura.perezmartinez@estudiantat.upc.edu</td>
                      </tr>
                      <tr>
                        <td>AMEP2</td>
                        <td>Lopez Núñez, Alex </td>
                        <td>alex.lopeznunez@estudiantat.upc.edu</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </label>
            <input
              type="file"
              id="estudiantesFile"
              accept=".xlsx"
              onChange={(e) => setEstudiantesFile(e.target.files[0])}
              required
            />
          </div>

          <div className="form-group-curso">
            <label htmlFor="nombreAsignatura">
              Nom del compte de GitHub de l&apos;assignatura
            </label>
            <input
              type="text"
              id="githubAsignatura"
              value={githubAsignatura}
              onChange={(e) => setGithubAsignatura(e.target.value)}
              required
            />
          </div>

          <div className="form-group-curso">
            <label htmlFor="nombreAsignatura">Definir Token de GitHub</label>
            <input
              type="password"
              placeholder="Introduir token de GitHub"
              value={tokenGithub}
              onChange={(e) => setTokenGithub(e.target.value)}
            />
          </div>

          <div className="form-group-curso">
            <label className="main-label">
              La gestió de tasques del curs es gestiona amb:
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="tasques"
                  value="GitHub"
                  checked={gestiotasques === 'GitHub'}
                  onChange={(e) => setGestioTasques(e.target.value)}
                />
                GitHub
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="tasques"
                  value="Taiga"
                  checked={gestiotasques === 'Taiga'}
                  onChange={(e) => setGestioTasques(e.target.value)}
                />
                Taiga
              </label>
            </div>
          </div>

          <div className="form-group-curso">
            <label>
              Indica quants períodes d&apos;avaluació tindrà aquest curs:
            </label>
            <select
              value={numPeriodosEvaluacion}
              onChange={handleNumPeriodosChange}
            >
              {[...Array(6).keys()].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-curso">
            <label>Dates d&apos;avaluació</label>
            {numPeriodosEvaluacion === 0 ? (
              <p className="no-periodos">
                S&apos;ha seleccionat que no hi hagi cap període
                d&apos;avaluació
              </p>
            ) : (
              periodosEvaluacion.map((periodo, index) => (
                <div key={index} className="evaluacion-fechas">
                  <label>Avaluació {index + 1}</label>
                  <input
                    type="date"
                    value={periodo.fechaInicio}
                    min={
                      index > 0
                        ? periodosEvaluacion[index - 1].fechaFin || undefined
                        : undefined
                    }
                    onChange={(e) =>
                      handleFechaChange(index, 'fechaInicio', e.target.value)
                    }
                    required
                  />
                  <input
                    type="date"
                    value={periodo.fechaFin}
                    onChange={(e) =>
                      handleFechaChange(index, 'fechaFin', e.target.value)
                    }
                    required
                  />
                </div>
              ))
            )}
          </div>
          {errorFechas && <p className="error-message">{errorFechas}</p>}
          <div className="form-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/cursos')}
            >
              Cancel·lar
            </button>
            <button type="submit" className="create-button">
              Crear curs
            </button>
          </div>
          {showErrorPopup && (
            <div className="error-popup">
              <div className="popup-content">
                <h2>Errors en l&apos;arxiu d&apos;estudiants</h2>
                <ul>
                  {uploadErrors.map((error, index) => (
                    <li key={index}>
                      <strong>{error}</strong>
                    </li>
                  ))}
                </ul>
                <button
                  className="close-popup-button"
                  onClick={() => setShowErrorPopup(false)}
                >
                  Tanca
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CrearCurso;
