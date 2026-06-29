import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeSolicitudesPendientes, subscribeSugerenciasPendientes } from '../services/firestoreService'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  LayoutDashboard, MapPin, Inbox, AlertTriangle, Megaphone,
  Activity, BarChart2, LogOut, ShieldAlert, Globe, Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',          end: true },
  { to: '/puntos',      icon: MapPin,          label: 'Puntos de ayuda' },
  { to: '/solicitudes', icon: Inbox,           label: 'Solicitudes',        badge: 'solicitudes' },
  { to: '/reportes',    icon: AlertTriangle,   label: 'Reportes urgentes',  badge: 'reportes' },
  { to: '/alertas',     icon: Megaphone,       label: 'Alertas oficiales' },
  { to: '/zonas',       icon: Activity,        label: 'Zonas de impacto' },
  { to: '/contadores',  icon: BarChart2,       label: 'Contadores por zona' },
  { section: 'VenezuelaConecta' },
  { to: '/recursos',     icon: Globe,          label: 'Recursos' },
  { to: '/sugerencias',  icon: Send,           label: 'Sugerencias',       badge: 'sugerencias' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reportesPendientes, setReportesPendientes] = useState(0)
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0)
  const [sugerenciasPendientes, setSugerenciasPendientes] = useState(0)

  useEffect(() => {
    const q = query(
      collection(db, 'reportes_urgentes'),
      where('estado', '==', 'reportado')
    )
    const u1 = onSnapshot(q, snap => setReportesPendientes(snap.size))
    const u2 = subscribeSolicitudesPendientes(setSolicitudesPendientes)
    const u3 = subscribeSugerenciasPendientes(setSugerenciasPendientes)
    return () => { u1(); u2(); u3() }
  }, [])

  const badgeCount = (kind) =>
    kind === 'reportes' ? reportesPendientes
      : kind === 'solicitudes' ? solicitudesPendientes
        : kind === 'sugerencias' ? sugerenciasPendientes
          : 0

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-400" />
            <span className="text-base font-semibold">
              <span className="text-red-400">Rescate</span>
              <span className="text-slate-200 font-light">Unidos</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Panel de moderación</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => {
            if (item.section) {
              return (
                <p key={`section-${i}`} className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
                  {item.section}
                </p>
              )
            }
            const { to, icon: Icon, label, end, badge } = item
            const count = badge ? badgeCount(badge) : 0
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150
                  ${isActive
                    ? 'bg-red-600/20 text-red-300 border-l-2 border-red-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {badge && count > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-red-600/30 flex items-center justify-center text-xs font-semibold text-red-300">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 truncate">{user?.email}</p>
              <p className="text-[10px] text-emerald-400">● En línea</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-danger w-full justify-center text-xs">
            <LogOut size={12} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
