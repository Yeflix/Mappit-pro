import { useEffect, useState } from 'react'
import {
  subscribeSugerencias, aprobarSugerencia, rechazarSugerencia, eliminarSugerencia,
} from '../services/firestoreService'
import { categoriaRecurso, plataformaRecurso } from '../constants/vc'
import { ModeracionBadge } from '../components/Badges'
import {
  Send, Check, X, Trash2, ChevronDown, ChevronUp, ExternalLink, Mail, UserX, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState([])
  const [filtro,   setFiltro]   = useState('pendiente')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => subscribeSugerencias('todos', setSugerencias), [])

  const filtradas = sugerencias.filter(s =>
    filtro === 'todos' ? true : (s.estadoModeracion ?? 'pendiente') === filtro
  )
  const contar = (e) => sugerencias.filter(s => (s.estadoModeracion ?? 'pendiente') === e).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Send size={20} className="text-sky-400" />
          Sugerencias · VenezuelaConecta
        </h1>
        <p className="text-sm text-slate-500">
          Recursos sugeridos por la comunidad (algunos sin sesión iniciada, por eso pueden venir sin email). Al aprobar, se publica en el directorio.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'rechazado', label: 'Rechazadas' },
          { key: 'todos',     label: 'Todas' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filtro === key
                ? 'bg-sky-600/20 text-sky-300 border-sky-500/40'
                : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}>
            {label}
            <span className="ml-1.5 text-slate-600">{key === 'todos' ? sugerencias.length : contar(key)}</span>
          </button>
        ))}
        <p className="self-center text-[10px] text-slate-600 ml-1">
          Las aprobadas se publican en Recursos y desaparecen de aquí.
        </p>
      </div>

      {filtradas.length === 0 ? (
        <div className="card p-12 text-center">
          <Send size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro === 'pendiente' ? 'No hay sugerencias pendientes ✓' : 'Sin sugerencias en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(s => (
            <SugerenciaCard key={s.id} sugerencia={s}
              isOpen={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function SugerenciaCard({ sugerencia: s, isOpen, onToggle }) {
  const [busy, setBusy] = useState(false)
  const c = categoriaRecurso(s.categoria)
  const p = plataformaRecurso(s.plataforma)
  const estadoMod = s.estadoModeracion ?? 'pendiente'
  const ts = s.creadoEn?.toDate?.()
  const anonima = !s.creadoPorUid && !s.creadoPorEmail

  const aprobar = async () => {
    setBusy(true)
    try {
      await aprobarSugerencia(s)
      toast.success('Recurso aprobado y publicado en VenezuelaConecta ✓')
    } catch (e) { toast.error('Error: ' + e.message) }
    setBusy(false)
  }
  const rechazar = async () => {
    setBusy(true)
    try {
      await rechazarSugerencia(s.id)
      toast('Sugerencia rechazada')
    } catch (e) { toast.error('Error: ' + e.message) }
    setBusy(false)
  }
  const borrar = async () => {
    if (!confirm('¿Eliminar esta sugerencia permanentemente?')) return
    try {
      await eliminarSugerencia(s.id)
      toast.success('Sugerencia eliminada')
    } catch (e) { toast.error('Error al eliminar: ' + e.message) }
  }

  return (
    <div className={`card overflow-hidden border transition-colors ${
      estadoMod === 'pendiente' ? 'border-sky-500/30' : 'border-slate-800'
    }`}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/30 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-sky-600/10 flex items-center justify-center flex-shrink-0 text-xl">{c.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200 truncate">{s.nombre}</p>
            <ModeracionBadge estado={estadoMod} />
            {anonima && (
              <span className="badge bg-slate-700/40 text-slate-400 border-slate-600">
                <UserX size={9} /> Anónima
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {c.etiqueta} · {p.etiqueta}
            {ts && <span className="ml-2 text-slate-600">· {ts.toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        {isOpen ? <ChevronUp size={15} className="text-slate-500 flex-shrink-0" />
                : <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />}
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 px-4 py-4 space-y-4">
          {s.descripcion && (
            <div><p className="text-[10px] text-slate-600 mb-1">Descripción</p>
              <p className="text-sm text-slate-300 leading-relaxed">{s.descripcion}</p></div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><p className="text-[10px] text-slate-600">URL</p>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> {s.url}
              </a>
            </div>
            {s.creadoPorEmail ? (
              <div><p className="text-[10px] text-slate-600">Sugerido por</p>
                <p className="text-slate-300 flex items-center gap-1"><Mail size={10} /> {s.creadoPorEmail}</p></div>
            ) : (
              <div><p className="text-[10px] text-slate-600">Sugerido por</p>
                <p className="text-slate-500 flex items-center gap-1"><UserX size={10} /> Sin sesión iniciada (anónimo)</p></div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 flex gap-2 flex-wrap justify-end">
            {estadoMod !== 'aprobado' && (
              <button onClick={aprobar} disabled={busy} className="btn-success text-xs gap-1.5 py-1.5 disabled:opacity-50">
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Aprobar y publicar
              </button>
            )}
            {estadoMod !== 'rechazado' && (
              <button onClick={rechazar} disabled={busy} className="btn-warning text-xs gap-1.5 py-1.5 disabled:opacity-50">
                <X size={12} /> Rechazar
              </button>
            )}
            <button onClick={borrar} className="btn-danger text-xs gap-1.5 py-1.5">
              <Trash2 size={11} /> Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
