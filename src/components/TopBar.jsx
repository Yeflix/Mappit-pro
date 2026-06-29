import { Menu, ShieldAlert } from 'lucide-react'

/**
 * Barra superior visible solo en móvil/tablet (<lg).
 * Aporta el botón hamburguesa que abre el Sidebar como drawer.
 */
export default function TopBar({ onOpenMenu }) {
  return (
    <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <button
        onClick={onOpenMenu}
        className="p-1.5 -ml-1 text-slate-300 hover:text-white"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-red-400" />
        <span className="text-sm font-semibold">
          <span className="text-red-400">Rescate</span>
          <span className="text-slate-200 font-light">Unidos</span>
        </span>
      </div>
    </header>
  )
}
