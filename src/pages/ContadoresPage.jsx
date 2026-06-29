import { useEffect, useState } from 'react'
import { subscribeContadores } from '../services/firestoreService'
import { BarChart2, MapPin, AlertTriangle, HeartHandshake, AlertOctagon } from 'lucide-react'

export default function ContadoresPage() {
  const [contadores, setContadores] = useState([])

  useEffect(() => subscribeContadores(setContadores), [])

  const num = (z, k) => z[k] ?? 0
  const actividad = (z) =>
    num(z, 'puntosActivos') + num(z, 'puntosSaturados') + num(z, 'puntosNecesitanDonaciones') +
    num(z, 'reportesPendientes') + num(z, 'reportesEnAtencion')

  const sorted = [...contadores].sort((a, b) => actividad(b) - actividad(a))

  const totales = contadores.reduce((acc, z) => ({
    puntosActivos:               (acc.puntosActivos ?? 0)               + num(z, 'puntosActivos'),
    puntosSaturados:             (acc.puntosSaturados ?? 0)             + num(z, 'puntosSaturados'),
    puntosNecesitanDonaciones:   (acc.puntosNecesitanDonaciones ?? 0)   + num(z, 'puntosNecesitanDonaciones'),
    reportesPendientes:          (acc.reportesPendientes ?? 0)          + num(z, 'reportesPendientes'),
    reportesEnAtencion:          (acc.reportesEnAtencion ?? 0)          + num(z, 'reportesEnAtencion'),
    serviciosVoluntariosActivos: (acc.serviciosVoluntariosActivos ?? 0) + num(z, 'serviciosVoluntariosActivos'),
  }), {})

  const RESUMEN = [
    { label: 'Puntos operativos',  value: totales.puntosActivos ?? 0,               icon: MapPin,         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Puntos saturados',   value: totales.puntosSaturados ?? 0,             icon: AlertOctagon,   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
    { label: 'Reportes urgentes',  value: (totales.reportesPendientes ?? 0) + (totales.reportesEnAtencion ?? 0), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Servicios voluntarios', value: totales.serviciosVoluntariosActivos ?? 0, icon: HeartHandshake, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <BarChart2 size={20} className="text-amber-400" />
          Contadores por zona
        </h1>
        <p className="text-sm text-slate-500">
          Agregados por estado (colección <code className="text-slate-400">contadores_zona</code>). Solo lectura — los mantiene una Cloud Function.
        </p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {RESUMEN.map(c => (
          <div key={c.label} className="card p-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={17} className={c.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">{c.label}</p>
                <p className="text-2xl font-semibold text-slate-100 leading-tight">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla por estado */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-medium text-slate-200">Detalle por estado ({contadores.length})</h2>
        </div>
        {contadores.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-600">Sin datos de contadores aún</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-500 border-b border-slate-800">
                  <th className="text-left font-medium px-4 py-2.5">Estado</th>
                  <th className="text-center font-medium px-3 py-2.5">🟢 Operativos</th>
                  <th className="text-center font-medium px-3 py-2.5">🟡 Saturados</th>
                  <th className="text-center font-medium px-3 py-2.5">🟠 Necesitan donaciones</th>
                  <th className="text-center font-medium px-3 py-2.5">🆘 Pendientes</th>
                  <th className="text-center font-medium px-3 py-2.5">🚑 En atención</th>
                  <th className="text-center font-medium px-3 py-2.5">🤝 Voluntarios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sorted.map(z => (
                  <tr key={z.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-medium text-slate-200">{z.estadoVenezuela ?? z.id}</td>
                    <td className="text-center text-emerald-400">{num(z, 'puntosActivos')}</td>
                    <td className="text-center text-amber-400">{num(z, 'puntosSaturados')}</td>
                    <td className="text-center text-orange-400">{num(z, 'puntosNecesitanDonaciones')}</td>
                    <td className="text-center text-red-400">{num(z, 'reportesPendientes')}</td>
                    <td className="text-center text-amber-300">{num(z, 'reportesEnAtencion')}</td>
                    <td className="text-center text-sky-400">{num(z, 'serviciosVoluntariosActivos')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
