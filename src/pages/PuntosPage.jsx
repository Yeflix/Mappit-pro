import { useEffect, useState } from 'react'
import {
  subscribePuntos, cambiarEstadoPunto, cambiarVerificacion,
  eliminarPunto, subscribeConfirmaciones,
} from '../services/firestoreService'
import {
  TIPOS_PUNTO, tipoPunto, ESTADOS_OPERATIVOS, estadoOperativo,
  VERIFICACIONES, ESTADOS_VE, nivelUrgencia, TIPOS_CONFIRMACION,
} from '../constants/rescate'
import { EstadoPuntoBadge, VerificacionBadge, UrgenciaBadge } from '../components/Badges'
import {
  MapPin, Search, Trash2, ChevronDown, ChevronUp, Phone,
  Instagram, ShieldCheck, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PuntosPage() {
  const [puntos,    setPuntos]    = useState([])
  const [busqueda,  setBusqueda]  = useState('')
  const [tipoFil,   setTipoFil]   = useState('')
  const [estadoFil, setEstadoFil] = useState('')
  const [veFil,     setVeFil]     = useState('')
  const [verifFil,  setVerifFil]  = useState('')
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => subscribePuntos(setPuntos, { estadoModeracion: 'aprobado' }), [])

  const filtrados = puntos.filter(p => {
    const q = busqueda.toLowerCase()
    if (q && !p.nombre?.toLowerCase().includes(q) &&
            !p.estadoVenezuela?.toLowerCase().includes(q) &&
            !p.descripcion?.toLowerCase().includes(q)) return false
    if (tipoFil   && p.tipo   !== tipoFil)   return false
    if (estadoFil && p.estado !== estadoFil) return false
    if (veFil     && p.estadoVenezuela !== veFil) return false
    if (verifFil  && p.verificacion !== verifFil) return false
    return true
  })

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}" permanentemente?`)) return
    await eliminarPunto(id)
    toast.success('Punto eliminado')
  }

  const operativos = puntos.filter(p => p.estado === 'operativo').length
  const verificados = puntos.filter(p => p.verificacion && p.verificacion !== 'comunidad').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <MapPin size={20} className="text-emerald-400" />
          Puntos de ayuda
        </h1>
        <p className="text-sm text-slate-500">
          {puntos.length} aprobados · {operativos} operativos · {verificados} verificados
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-8 h-8 text-xs" placeholder="Buscar por nombre, estado o descripción..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="input h-8 text-xs w-44" value={tipoFil} onChange={e => setTipoFil(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS_PUNTO.map(t => <option key={t.valor} value={t.valor}>{t.emoji} {t.etiqueta}</option>)}
        </select>
        <select className="input h-8 text-xs w-40" value={estadoFil} onChange={e => setEstadoFil(e.target.value)}>
          <option value="">Cualquier estado op.</option>
          {ESTADOS_OPERATIVOS.map(e => <option key={e.valor} value={e.valor}>{e.emoji} {e.etiqueta}</option>)}
        </select>
        <select className="input h-8 text-xs w-40" value={veFil} onChange={e => setVeFil(e.target.value)}>
          <option value="">Todos los estados VE</option>
          {ESTADOS_VE.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input h-8 text-xs w-44" value={verifFil} onChange={e => setVerifFil(e.target.value)}>
          <option value="">Cualquier verificación</option>
          {VERIFICACIONES.map(v => <option key={v.valor} value={v.valor}>{v.emoji} {v.etiqueta}</option>)}
        </select>
        {(busqueda || tipoFil || estadoFil || veFil || verifFil) && (
          <button onClick={() => { setBusqueda(''); setTipoFil(''); setEstadoFil(''); setVeFil(''); setVerifFil('') }}
            className="text-xs text-slate-500 hover:text-slate-300">Limpiar</button>
        )}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Sin puntos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(p => (
            <PuntoCard
              key={p.id}
              punto={p}
              isOpen={expanded === p.id}
              onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
              onEliminar={() => handleEliminar(p.id, p.nombre)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PuntoCard({ punto: p, isOpen, onToggle, onEliminar }) {
  const t = tipoPunto(p.tipo)
  const ts = p.ultimaActualizacion?.toDate?.() ?? p.creadoEn?.toDate?.()
  const etiquetaTipo = p.tipo === 'otro' && p.tipoOtroDescripcion ? p.tipoOtroDescripcion : t.etiqueta
  const pct = p.capacidad ? Math.round(100 * (p.capacidadOcupada ?? 0) / p.capacidad) : null

  const handleEstado = async (estado) => {
    await cambiarEstadoPunto(p.id, estado)
    toast.success(`Estado: ${estadoOperativo(estado).etiqueta}`)
  }
  const handleVerif = async (v) => {
    const por = v === 'comunidad' ? null : (prompt('¿Verificado por? (organismo/voluntario)', p.verificadoPor || '') || null)
    await cambiarVerificacion(p.id, v, por)
    toast.success('Verificación actualizada')
  }

  return (
    <div className={`card overflow-hidden border transition-colors ${
      p.verificacion === 'comunidad' ? 'border-amber-500/20' : 'border-slate-800'
    }`}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/30 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-emerald-600/10 flex items-center justify-center flex-shrink-0 text-xl">
          {t.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200 truncate">{p.nombre}</p>
            <VerificacionBadge verificacion={p.verificacion} />
            <EstadoPuntoBadge estado={p.estado} />
            {p.urgencia && p.urgencia !== 'informativa' && <UrgenciaBadge urgencia={p.urgencia} />}
            {p.esMovil && <span className="badge bg-sky-500/10 text-sky-400 border-sky-500/30">📱 Móvil</span>}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {etiquetaTipo} · {p.estadoVenezuela}
            {p.confirmacionesRecientes > 0 && <span className="ml-2 text-emerald-500">· {p.confirmacionesRecientes} confirmaciones</span>}
            {ts && <span className="ml-2 text-slate-600">· {ts.toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        {isOpen ? <ChevronUp size={15} className="text-slate-500 flex-shrink-0" />
                : <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />}
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 px-4 py-4 space-y-4">
          {p.descripcion && (
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Descripción</p>
              <p className="text-sm text-slate-300 leading-relaxed">{p.descripcion}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {p.referencia && (
              <div><p className="text-[10px] text-slate-600">Referencia</p><p className="text-slate-300">{p.referencia}</p></div>
            )}
            {p.verificadoPor && (
              <div><p className="text-[10px] text-slate-600">Verificado por</p><p className="text-slate-300 flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-400" /> {p.verificadoPor}</p></div>
            )}
            {p.telefono && (
              <div><p className="text-[10px] text-slate-600">Teléfono</p>
                <a href={`tel:${p.telefono}`} className="text-emerald-400 hover:underline flex items-center gap-1"><Phone size={10} /> {p.telefono}</a></div>
            )}
            {p.whatsapp && (
              <div><p className="text-[10px] text-slate-600">WhatsApp</p>
                <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1"><Phone size={10} /> {p.whatsapp}</a></div>
            )}
            {p.instagram && (
              <div><p className="text-[10px] text-slate-600">Instagram</p>
                <a href={`https://instagram.com/${p.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-pink-400 hover:underline flex items-center gap-1"><Instagram size={10} /> {p.instagram}</a></div>
            )}
            {p.redSocial && (
              <div><p className="text-[10px] text-slate-600">Red social</p><p className="text-slate-300">{p.redSocial}</p></div>
            )}
            {p.latitud != null && p.longitud != null && (
              <div><p className="text-[10px] text-slate-600">Coordenadas</p>
                <a href={`https://maps.google.com/?q=${p.latitud},${p.longitud}`} target="_blank" rel="noreferrer" className="text-primary-400 hover:underline flex items-center gap-1"><MapPin size={10} /> Ver en Google Maps</a></div>
            )}
            {p.capacidad != null && (
              <div><p className="text-[10px] text-slate-600">Capacidad</p>
                <p className="text-slate-300">{p.capacidadOcupada ?? 0} / {p.capacidad}{pct != null && <span className="text-slate-500"> ({pct}%)</span>}</p></div>
            )}
          </div>

          {Array.isArray(p.necesidadesActuales) && p.necesidadesActuales.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Necesidades actuales</p>
              <div className="flex gap-1.5 flex-wrap">
                {p.necesidadesActuales.map(n => (
                  <span key={n} className="badge bg-orange-500/10 text-orange-400 border-orange-500/30">{n}</span>
                ))}
              </div>
            </div>
          )}

          <Confirmaciones puntoId={p.id} />

          {/* Acciones de moderación */}
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div>
              <p className="text-[10px] text-slate-600 mb-1.5">Estado operativo</p>
              <div className="flex gap-2 flex-wrap">
                {ESTADOS_OPERATIVOS.filter(e => e.valor !== p.estado).map(e => (
                  <button key={e.valor} onClick={() => handleEstado(e.valor)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${e.cls} hover:opacity-80`}>
                    {e.emoji} {e.etiqueta}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-1.5">Verificación</p>
              <div className="flex gap-2 flex-wrap">
                {VERIFICACIONES.filter(v => v.valor !== p.verificacion).map(v => (
                  <button key={v.valor} onClick={() => handleVerif(v.valor)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${v.cls} hover:opacity-80`}>
                    {v.emoji} {v.etiqueta}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onEliminar} className="btn-danger text-xs gap-1.5 py-1.5">
                <Trash2 size={11} /> Eliminar punto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Confirmaciones({ puntoId }) {
  const [confs, setConfs] = useState([])
  useEffect(() => subscribeConfirmaciones(puntoId, setConfs), [puntoId])
  if (confs.length === 0) return null
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
      <p className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
        <Users size={12} className="text-sky-400" /> Confirmaciones de la comunidad ({confs.length})
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {confs.map(c => {
          const info = TIPOS_CONFIRMACION[c.tipo] ?? { emoji: '•', etiqueta: c.tipo, revision: false }
          const ts = c.creadoEn?.toDate?.()
          return (
            <div key={c.id} className={`text-xs flex items-start gap-2 ${info.revision ? 'text-red-300' : 'text-slate-400'}`}>
              <span>{info.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{info.etiqueta}</span>
                {c.comentario && <span className="text-slate-500"> — {c.comentario}</span>}
                {ts && <span className="text-slate-600 ml-1">· {ts.toLocaleDateString('es', { day: '2-digit', month: 'short' })}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
