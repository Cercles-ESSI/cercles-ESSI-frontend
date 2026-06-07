import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/usuarios/LoginPage';
import HomePage from './pages/home/HomePage';
import PerfilPage from './pages/usuarios/PerfilPage';
import PrivateRoute from './utils/PrivateRoute';
import CursosPage from './pages/cursos/CursosPage';
import CursoPage from './pages/cursos/CursoPage';
import CrearCurso from './pages/cursos/CrearCurso';
import VerificarCurso from './pages/cursos/VerificarCurso';
import EquiposPage from './pages/equipos/EquiposPage';
import EquipoPage from './pages/equipos/EquipoPage';
import CrearEquipo from './pages/equipos/CrearEquipo';
import EquipoMetricsPage from './pages/equipos/EquipoMetricsPage';
import EquipoMetricsHistory from './pages/equipos/EquipoMetricsHistory';
import EquipoMetricsTaiga from './pages/equipos/EquipoMetricsTaiga';
import EquipoMetricsGitHub from './pages/equipos/EquipoMetricsGitHub';
import DatosGeneralesEquipoPage from './pages/equipos/DatosGeneralesEquipoPage';
import EvaluacionPage from './pages/evaluaciones/EvaluacionPage';
import EvaluacionesGeneralesPage from './pages/evaluaciones/EvaluacionesGeneralesPage';
import MisEvaluacionesPage from './pages/evaluaciones/MisEvaluacionesPage';
import NotFoundPage from './pages/common/NotFoundPage';
import ForbiddenPage from './pages/common/ForbiddenPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <PerfilPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos"
          element={
            <PrivateRoute requiredRole="Profesor">
              <CursosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/:id"
          element={
            <PrivateRoute requiredRole="Profesor">
              <CursoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/crear"
          element={
            <PrivateRoute requiredRole="Profesor">
              <CrearCurso />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/crear/verificar"
          element={
            <PrivateRoute requiredRole="Profesor">
              <VerificarCurso />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipos"
          element={
            <PrivateRoute requiredRole="Estudiante">
              <EquiposPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipos/:id/"
          element={
            <PrivateRoute>
              <EquipoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipos/crear"
          element={
            <PrivateRoute>
              <CrearEquipo />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:id/metrics"
          element={
            <PrivateRoute requiredRole="Profesor">
              <EquipoMetricsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:id/taiga-metrics"
          element={
            <PrivateRoute requiredRole="Profesor">
              <EquipoMetricsTaiga />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:id/github-metrics"
          element={
            <PrivateRoute requiredRole="Profesor">
              <EquipoMetricsGitHub />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:equipoId/datos_generales"
          element={
            <PrivateRoute requiredRole="Profesor">
              <DatosGeneralesEquipoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:equipoId/datos_historicos"
          element={
            <PrivateRoute requiredRole="Profesor">
              <EquipoMetricsHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:equipoId/evaluacion"
          element={
            <PrivateRoute requiredRole="Estudiante">
              <EvaluacionPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:equipoId/evaluaciones_generales"
          element={
            <PrivateRoute requiredRole="Profesor">
              <EvaluacionesGeneralesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/equipo/:equipoId/les_meves_avaluacions"
          element={
            <PrivateRoute requiredRole="Estudiante">
              <MisEvaluacionesPage />
            </PrivateRoute>
          }
        />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
