import { NavLink, useNavigate } from 'react-router-dom'
import { ShieldAlert, LogOut, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { NAV } from '../constants/nav'

/**
 * Sidebar de navegación. En desktop (lg+) es fija a la izquierda.
 * En móvil/tablet se renderiza como drawer deslizable controlado por `open`.
 */
export default function Sidebar({ open, onClose, counts }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const badgeCount = (kind) => counts?.[kind] ?? 0

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <>
      {/* Backdrop móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800
          flex flex-col transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:w-56 lg:flex-shrink-0
        `}
      >
        {/* Logo + cerrar */}
        <div className="px-5 py-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-400" />
              <span className="text-base font-semibold">
                <span className="text-red-400">Rescate</span>
                <span className="text-slate-200 font-light">Unidos</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Panel de moderación</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-200"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => {
            if (item.section) {
              return (
                <p
                  key={`section-${i}`}
                  className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase"
                >
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
                onClick={onClose}
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

        {/* Usuario + logout */}
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
    </>
  )
}
