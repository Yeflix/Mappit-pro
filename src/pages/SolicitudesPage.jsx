import { useEffect, useState } from 'react'
import {
  subscribeSolicitudes, aprobarSolicitud, rechazarSolicitud, eliminarSolicitud,
} from '../services/firestoreService'
import { tipoPunto, estadoOperativo } from '../constants/rescate'
import { ModeracionBadge, UrgenciaBadge } from '../components/Badges'
import {
  Inbox, Check, X, Trash2, ChevronDown, ChevronUp, MapPin, Phone, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([])
  const [filtro,   setFiltro]   = useState('pendiente')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => subscribeSolicitudes('todos', setSolicitudes), [])

  const filtradas = solicitudes.filter(s =>
    filtro === 'todos' ? true : (s.estadoModeracion ?? 'pendiente') === filtro
  )
  const contar = (e) => solicitudes.filter(s => (s.estadoModeracion ?? 'pendiente') === e).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Inbox size={20} className="text-amber-400" />
          Solicitudes de puntos
        </h1>
        <p className="text-sm text-slate-500">
          Registros enviados por la comunidad. Al aprobar, el punto se publica en la app y se genera una alerta en Novedades.
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
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}>
            {label}
            <span className="ml-1.5 text-slate-600">{key === 'todos' ? solicitudes.length : contar(key)}</span>
          </button>
        ))}
        <p className="self-center text-[10px] text-slate-600 ml-1">
          Las aprobadas se publican en Puntos de ayuda y desaparecen de aquí.
        </p>
      </div>

      {filtradas.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro === 'pendiente' ? 'No hay solicitudes pendientes ✓' : 'Sin solicitudes en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(s => (
            <SolicitudCard key={s.id} solicitud={s}
              isOpen={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function SolicitudCard({ solicitud: s, isOpen, onToggle }) {
  const [busy, setBusy] = useState(false)
  const t = tipoPunto(s.tipo)
  const estadoMod = s.estadoModeracion ?? 'pendiente'
  const ts = s.creadoEn?.toDate?.()
  const etiquetaTipo = s.tipo === 'otro' && s.tipoOtroDescripcion ? s.tipoOtroDescripcion : t.etiqueta

  const aprobar = async () => {
    const por = prompt('¿Verificado por? (opcional — deja vacío para "comunidad")', '') || null
    setBusy(true)
    try {
      await aprobarSolicitud(s, por)
      toast.success('Punto aprobado y publicado en la app ✓')
    } catch (e) { toast.error('Error: ' + e.message) }
    setBusy(false)
  }
  const rechazar = async () => {
    const motivo = prompt('Motivo del rechazo (opcional):', '') || ''
    setBusy(true)
    try {
      await rechazarSolicitud(s.id, motivo)
      toast('Solicitud rechazada')
    } catch (e) { toast.error('Error: ' + e.message) }
    setBusy(false)
  }
  const borrar = async () => {
    if (!confirm('¿Eliminar esta solicitud permanentemente?')) return
    await eliminarSolicitud(s.id)
    toast.success('Solicitud eliminada')
  }

  return (
    <div className={`card overflow-hidden border transition-colors ${
      estadoMod === 'pendiente' ? 'border-amber-500/30' : 'border-slate-800'
    }`}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/30 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-amber-600/10 flex items-center justify-center flex-shrink-0 text-xl">{t.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200 truncate">{s.nombre}</p>
            <ModeracionBadge estado={estadoMod} />
            {s.urgencia && s.urgencia !== 'informativa' && <UrgenciaBadge urgencia={s.urgencia} />}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {etiquetaTipo} · {s.estadoVenezuela}
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
            {s.referencia && <div><p className="text-[10px] text-slate-600">Referencia</p><p className="text-slate-300">{s.referencia}</p></div>}
            <div><p className="text-[10px] text-slate-600">Estado operativo declarado</p><p className="text-slate-300">{estadoOperativo(s.estado).etiqueta}</p></div>
            {s.telefono && <div><p className="text-[10px] text-slate-600">Teléfono</p><a href={`tel:${s.telefono}`} className="text-emerald-400 hover:underline flex items-center gap-1"><Phone size={10} /> {s.telefono}</a></div>}
            {s.whatsapp && <div><p className="text-[10px] text-slate-600">WhatsApp</p><a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1"><Phone size={10} /> {s.whatsapp}</a></div>}
            {s.latitud != null && s.longitud != null && (
              <div><p className="text-[10px] text-slate-600">Coordenadas</p>
                <a href={`https://maps.google.com/?q=${s.latitud},${s.longitud}`} target="_blank" rel="noreferrer" className="text-primary-400 hover:underline flex items-center gap-1"><MapPin size={10} /> Ver en Google Maps</a></div>
            )}
            {s.creadoPorUid && <div><p className="text-[10px] text-slate-600">UID del autor</p><p className="text-slate-400 font-mono text-[10px]">{s.creadoPorUid}</p></div>}
          </div>

          {Array.isArray(s.necesidadesActuales) && s.necesidadesActuales.length > 0 && (
            <div><p className="text-[10px] text-slate-600 mb-1">Necesidades actuales</p>
              <div className="flex gap-1.5 flex-wrap">{s.necesidadesActuales.map(n => <span key={n} className="badge bg-orange-500/10 text-orange-400 border-orange-500/30">{n}</span>)}</div></div>
          )}

          {estadoMod === 'rechazado' && s.motivoRechazo && (
            <p className="text-xs text-red-300">Motivo del rechazo: {s.motivoRechazo}</p>
          )}

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
