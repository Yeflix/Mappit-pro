import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { usePendingCounts } from '../hooks/usePendingCounts'

/**
 * Shell de la app autenticada: Sidebar (drawer en móvil) + TopBar + contenido.
 * Cierra el drawer automáticamente al cambiar de ruta.
 */
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const counts = usePendingCounts()
  const { pathname } = useLocation()

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        counts={counts}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
