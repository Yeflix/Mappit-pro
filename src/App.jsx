// src/App.jsx — RescateUnidos panel de moderación
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PuntosPage from './pages/PuntosPage'
import SolicitudesPage from './pages/SolicitudesPage'
import ReportesPage from './pages/ReportesPage'
import AlertasPage from './pages/AlertasPage'
import ZonasPage from './pages/ZonasPage'
import ContadoresPage from './pages/ContadoresPage'
import RecursosPage from './pages/RecursosPage'
import SugerenciasPage from './pages/SugerenciasPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index               element={<DashboardPage />} />
        <Route path="puntos"        element={<PuntosPage />} />
        <Route path="solicitudes"   element={<SolicitudesPage />} />
        <Route path="reportes"      element={<ReportesPage />} />
        <Route path="alertas"       element={<AlertasPage />} />
        <Route path="zonas"         element={<ZonasPage />} />
        <Route path="contadores"    element={<ContadoresPage />} />
        <Route path="recursos"      element={<RecursosPage />} />
        <Route path="sugerencias"   element={<SugerenciasPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
