import { useEffect, useState } from 'react'
import { subscribeReportes, actualizarEstadoReporte, eliminarReporte } from '../services/firestoreService'
import { ESTADOS_REPORTE, tipoReporte } from '../constants/rescate'
import { AlertTriangle, ChevronDown, ChevronUp, Phone, MapPin, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'


export default function ReportesPage() {
  const [reportes,  setReportes]  = useState([])
  const [filtro,    setFiltro]    = useState('reportado')
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    return subscribeReportes('todos', setReportes)
  }, [])

  const filtrados = reportes.filter(r =>
    filtro === 'todos' ? true : r.estado === filtro
  )

  const contarEstado = (e) => reportes.filter(r => r.estado === e).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-400" />
          Reportes urgentes
        </h1>
        <p className="text-sm text-slate-500">
          Emergencias reportadas por los usuarios — datos privados visibles solo aquí
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'reportado',   label: 'Sin atender' },
          { key: 'en_atencion', label: 'En atención' },
          { key: 'todos',       label: 'Todos' },
          { key: 'resuelto_rescatado', label: 'Rescatados' },
          { key: 'no_confirmado',      label: 'No confirmados' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filtro === key
                ? 'bg-red-600/20 text-red-300 border-red-500/40'
                : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}>
            {label}
            <span className="ml-1.5 text-slate-600">
              {key === 'todos' ? reportes.length : contarEstado(key)}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro === 'reportado' ? 'No hay reportes sin atender ✓' : 'Sin reportes en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => (
            <ReporteCard
              key={r.id}
              reporte={r}
              isOpen={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReporteCard({ reporte: r, isOpen, onToggle }) {
  const [actualizando, setActualizando] = useState(false)
  const [atendidoPor, setAtendidoPor]   = useState(r.atendidoPor ?? '')
  const ts = r.creadoEn?.toDate?.()

  const estadoInfo = ESTADOS_REPORTE.find(e => e.valor === r.estado) ?? ESTADOS_REPORTE[0]

  const cambiarEstado = async (nuevoEstado) => {
    setActualizando(true)
    try {
      await actualizarEstadoReporte(r.id, nuevoEstado, atendidoPor || null)
      toast.success('Estado actualizado')
    } catch (e) {
      toast.error('Error: ' + e.message)
    }
    setActualizando(false)
  }

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar este reporte permanentemente?')) return
    await eliminarReporte(r.id)
    toast('Reporte eliminado')
  }

  const tituloMostrar = r.tipo === 'otro' && r.tituloOtro
    ? r.tituloOtro
    : `${tipoReporte(r.tipo).emoji} ${tipoReporte(r.tipo).etiqueta}`

  return (
    <div className={`card overflow-hidden border transition-colors ${
      r.estado === 'reportado'   ? 'border-red-500/30'
      : r.estado === 'en_atencion' ? 'border-amber-500/20'
      : 'border-slate-800'
    }`}>
      {/* Cabecera */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-red-600/10 flex items-center justify-center flex-shrink-0 text-lg">
          {r.tipo === 'persona_atrapada' ? '🆘'
            : r.tipo === 'emergencia_medica' ? '🏥'
            : r.tipo === 'necesita_rescate_inmediato' ? '🚨' : '❗'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200 truncate">{tituloMostrar}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${estadoInfo.cls}`}>
              {estadoInfo.emoji} {estadoInfo.etiqueta}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            📍 {r.descripcionUbicacion}
            {r.estadoVenezuela && <span className="ml-2 text-slate-600">· {r.estadoVenezuela}</span>}
            {ts && (
              <span className="ml-2 text-slate-600">
                · {ts.toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        {isOpen ? <ChevronUp size={15} className="text-slate-500 flex-shrink-0" />
                : <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />}
      </button>

      {/* Detalle */}
      {isOpen && (
        <div className="border-t border-slate-800 px-4 py-4 space-y-4">
          {/* Descripción */}
          {r.descripcion && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Descripción de la emergencia</p>
              <p className="text-sm text-slate-300 leading-relaxed">{r.descripcion}</p>
            </div>
          )}

          {/* Datos privados */}
          <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs font-medium text-red-300 mb-2">🔒 Datos privados — moderadores y equipos de rescate autorizados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-600">Contacto del reportante</p>
                {r.contactoReportante ? (
                  <a href={`tel:${r.contactoReportante}`}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                    <Phone size={11} /> {r.contactoReportante}
                  </a>
                ) : (
                  <p className="text-xs text-slate-600">No proporcionado</p>
                )}
              </div>
              {r.latitud && r.longitud && (
                <div>
                  <p className="text-[10px] text-slate-600">Coordenadas GPS</p>
                  <a
                    href={`https://maps.google.com/?q=${r.latitud},${r.longitud}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                  >
                    <MapPin size={11} /> {r.latitud.toFixed(5)}, {r.longitud.toFixed(5)}
                  </a>
                </div>
              )}
              {r.atendidoPor && (
                <div>
                  <p className="text-[10px] text-slate-600">Atendido por</p>
                  <p className="text-xs text-slate-300">{r.atendidoPor}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cambiar estado */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Cambiar estado</p>
            <div className="flex gap-2 mb-3">
              <input
                value={atendidoPor}
                onChange={e => setAtendidoPor(e.target.value)}
                placeholder="Organismo que atiende (ej: Protección Civil Miranda)"
                className="input text-xs flex-1 h-8"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS_REPORTE.filter(e => e.valor !== r.estado).map(e => (
                <button
                  key={e.valor}
                  onClick={() => cambiarEstado(e.valor)}
                  disabled={actualizando}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${e.cls} hover:opacity-80 disabled:opacity-50`}
                >
                  {actualizando ? <Loader2 size={11} className="animate-spin inline mr-1" /> : null}
                  {e.emoji} {e.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Eliminar */}
          <div className="flex justify-end pt-1">
            <button onClick={handleEliminar} className="btn-danger text-xs gap-1.5 py-1.5">
              <Trash2 size={11} /> Eliminar reporte
            </button>
          </div>
        </div>
      )}
    </div>
  )
}