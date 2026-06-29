import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import PrivateRoute from '../components/PrivateRoute'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import PuntosPage from '../pages/PuntosPage'
import SolicitudesPage from '../pages/SolicitudesPage'
import ReportesPage from '../pages/ReportesPage'
import AlertasPage from '../pages/AlertasPage'
import ZonasPage from '../pages/ZonasPage'
import ContadoresPage from '../pages/ContadoresPage'
import RecursosPage from '../pages/RecursosPage'
import SugerenciasPage from '../pages/SugerenciasPage'

// Rutas privadas del panel. Mantener planas y agrupadas por feature.
const PRIVATE_ROUTES = [
  { index: true,            element: <DashboardPage /> },
  { path: 'puntos',         element: <PuntosPage /> },
  { path: 'solicitudes',    element: <SolicitudesPage /> },
  { path: 'reportes',       element: <ReportesPage /> },
  { path: 'alertas',        element: <AlertasPage /> },
  { path: 'zonas',          element: <ZonasPage /> },
  { path: 'contadores',     element: <ContadoresPage /> },
  { path: 'recursos',       element: <RecursosPage /> },
  { path: 'sugerencias',    element: <SugerenciasPage /> },
]

export default function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={<PrivateRoute><Layout /></PrivateRoute>}
      >
        {PRIVATE_ROUTES.map((r, i) =>
          r.index
            ? <Route key="index" index element={r.element} />
            : <Route key={r.path} path={r.path} element={r.element} />
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
