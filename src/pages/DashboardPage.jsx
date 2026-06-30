import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  subscribePuntos, subscribeReportes, subscribeAlertas,
  subscribeContadores, subscribeSolicitudesPendientes,
  subscribeRecursos, subscribeSugerenciasPendientes,
  subscribeContadoresPersonas,
} from '../services/firestoreService'
import { tipoPunto, tipoReporte, estadoReporte } from '../constants/rescate'
import {
  MapPin, AlertTriangle, Megaphone, BarChart2, Inbox,
  CheckCircle, ChevronRight, Activity, Globe, Send, Users,
} from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [puntos,     setPuntos]     = useState([])
  const [reportes,   setReportes]   = useState([])
  const [alertas,    setAlertas]    = useState([])
  const [contadores, setContadores] = useState([])
  const [solicitudes, setSolicitudes] = useState(0)
  const [recursos,   setRecursos]   = useState([])
  const [sugerencias, setSugerencias] = useState(0)
  const [personasContadores, setPersonasContadores] = useState({ total: 0, desaparecidos: 0, encontrados: 0 })

  useEffect(() => {
    const u1 = subscribePuntos(setPuntos, { estadoModeracion: 'aprobado' })
    const u2 = subscribeReportes('todos', setReportes)
    const u3 = subscribeAlertas(setAlertas)
    const u4 = subscribeContadores(setContadores)
    const u5 = subscribeSolicitudesPendientes(setSolicitudes)
    const u6 = subscribeRecursos(setRecursos)
    const u7 = subscribeSugerenciasPendientes(setSugerencias)
    const u8 = subscribeContadoresPersonas(setPersonasContadores)
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8() }
  }, [])

  // Totales desde contadores_zona (agregados por Cloud Functions) — precisos
  // sin importar el limit(100) de subscribePuntos.
  const num = (z, k) => z[k] ?? 0
  const totalPuntosOperativos  = contadores.reduce((s, z) => s + num(z, 'puntosActivos'), 0)
  const totalPuntosVerificados = contadores.reduce((s, z) => s + num(z, 'puntosVerificados'), 0)

  const stats = {
    puntosOperativos:   totalPuntosOperativos,
    puntosVerificados:  totalPuntosVerificados,
    reportesPendientes: reportes.filter(r => r.estado === 'reportado').length,
    reportesEnAtencion: reportes.filter(r => r.estado === 'en_atencion').length,
    reportesResueltos:  reportes.filter(r => r.estado?.startsWith('resuelto')).length,
    totalAlertas:       alertas.length,
  }

  const CARDS = [
    { label: 'Puntos operativos', value: stats.puntosOperativos, sub: `${stats.puntosVerificados} verificados`, icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-500/10', to: '/puntos' },
    { label: 'Solicitudes pendientes', value: solicitudes, sub: 'esperando moderación', icon: Inbox, color: 'text-amber-400', bg: 'bg-amber-500/10', to: '/solicitudes' },
    { label: 'Reportes urgentes', value: stats.reportesPendientes + stats.reportesEnAtencion, sub: `${stats.reportesPendientes} sin atender`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', to: '/reportes' },
    { label: 'Alertas oficiales', value: stats.totalAlertas, sub: 'publicadas en la app', icon: Megaphone, color: 'text-sky-400', bg: 'bg-sky-500/10', to: '/alertas' },
  ]

  const topZonas = [...contadores]
    .sort((a, b) => (num(b, 'puntosActivos') + num(b, 'reportesPendientes')) - (num(a, 'puntosActivos') + num(a, 'reportesPendientes')))
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Situación en tiempo real — Venezuela</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Activity size={13} className="animate-pulse" /> En vivo
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(c => (
          <div key={c.label} onClick={() => navigate(c.to)}
            className="card p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={17} className={c.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">{c.label}</p>
                <p className="text-2xl font-semibold text-slate-100 leading-tight">{c.value}</p>
                <p className="text-[10px] text-slate-600">{c.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Personas — resumen */}
      <div>
        <p className="text-[10px] font-semibold tracking-wide text-slate-600 uppercase mb-2">Personas</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate('/personas')}
            className="card p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Users size={17} className="text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Desaparecidos</p>
                <p className="text-2xl font-semibold text-slate-100 leading-tight">{personasContadores.desaparecidos}</p>
                <p className="text-[10px] text-slate-600">de {personasContadores.total} reportes totales</p>
              </div>
            </div>
          </div>
          <div onClick={() => navigate('/personas')}
            className="card p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={17} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Localizados</p>
                <p className="text-2xl font-semibold text-slate-100 leading-tight">{personasContadores.encontrados}</p>
                <p className="text-[10px] text-slate-600">encontrados / hospital / refugio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VenezuelaConecta — resumen */}
      <div>
        <p className="text-[10px] font-semibold tracking-wide text-slate-600 uppercase mb-2">VenezuelaConecta</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate('/recursos')}
            className="card p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <Globe size={17} className="text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Recursos publicados</p>
                <p className="text-2xl font-semibold text-slate-100 leading-tight">{recursos.length}</p>
                <p className="text-[10px] text-slate-600">{recursos.filter(r => r.verificado).length} verificados</p>
              </div>
            </div>
          </div>
          <div onClick={() => navigate('/sugerencias')}
            className="card p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Send size={17} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Sugerencias pendientes</p>
                <p className="text-2xl font-semibold text-slate-100 leading-tight">{sugerencias}</p>
                <p className="text-[10px] text-slate-600">esperando moderación</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reportes urgentes recientes */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              Reportes urgentes recientes
              {stats.reportesPendientes > 0 && (
                <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">{stats.reportesPendientes} sin atender</span>
              )}
            </h2>
            <button onClick={() => navigate('/reportes')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">Ver todos <ChevronRight size={12} /></button>
          </div>
          <div className="divide-y divide-slate-800">
            {reportes.slice(0, 6).map(r => {
              const t = tipoReporte(r.tipo)
              const e = estadoReporte(r.estado)
              return (
                <div key={r.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800/30">
                  <span className="text-lg mt-0.5">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{r.tipo === 'otro' && r.tituloOtro ? r.tituloOtro : t.etiqueta}</p>
                    <p className="text-xs text-slate-500 truncate">{r.descripcionUbicacion}</p>
                    <p className="text-[10px] text-slate-600">{r.estadoVenezuela}</p>
                  </div>
                  <span className={`badge ${e.cls} flex-shrink-0`}>{e.emoji} {e.etiqueta}</span>
                </div>
              )
            })}
            {reportes.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-600">Sin reportes urgentes activos ✓</div>}
          </div>
        </div>

        {/* Actividad por zona */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2"><BarChart2 size={14} className="text-amber-400" /> Estados con más actividad</h2>
            <button onClick={() => navigate('/contadores')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">Ver todos <ChevronRight size={12} /></button>
          </div>
          <div className="divide-y divide-slate-800">
            {topZonas.map(z => (
              <div key={z.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium">{z.estadoVenezuela ?? z.id}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] text-emerald-400">📍 {num(z, 'puntosActivos')} puntos</span>
                    <span className="text-[10px] text-red-400">🆘 {num(z, 'reportesPendientes')} urgentes</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 flex-shrink-0">{num(z, 'serviciosVoluntariosActivos')} voluntarios</p>
              </div>
            ))}
            {topZonas.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-600">Sin datos de zonas aún</div>}
          </div>
        </div>
      </div>

      {/* Puntos recientes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2"><MapPin size={14} className="text-emerald-400" /> Puntos de ayuda recientes</h2>
          <button onClick={() => navigate('/puntos')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">Ver todos <ChevronRight size={12} /></button>
        </div>
        <div className="divide-y divide-slate-800">
          {puntos.slice(0, 5).map(p => {
            const t = tipoPunto(p.tipo)
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30">
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.nombre}</p>
                    {p.verificacion && p.verificacion !== 'comunidad' && <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{t.etiqueta} · {p.estadoVenezuela}</p>
                </div>
              </div>
            )
          })}
          {puntos.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-600">Sin puntos publicados aún</div>}
        </div>
      </div>
    </div>
  )
}
