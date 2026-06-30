import { useEffect, useMemo, useState } from 'react'
import {
  subscribeMetricas, guardarMetricaEstado, guardarMetricasEnLote, eliminarMetricaEstado,
} from '../services/firestoreService'
import { ESTADOS_VE } from '../constants/rescate'
import { idDeEstado, nivelPorPercentil } from '../constants/personas'
import { NivelImpactoBadge } from '../components/Badges'
import { PieChart, Plus, Trash2, Pencil, X, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  estado: '', totalPersonas: '', desaparecidos: '', encontrados: '',
  enHospital: '', enRefugio: '',
}

export default function MetricasPage() {
  const [metricas, setMetricas] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [recalculando, setRecalculando] = useState(false)

  useEffect(() => subscribeMetricas(setMetricas), [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const reset = () => { setForm(EMPTY); setEditId(null); setShowForm(false) }

  const estadosDisponibles = useMemo(
    () => ESTADOS_VE.filter(e => editId || !metricas.some(m => m.id === idDeEstado(e))),
    [metricas, editId]
  )

  const maxTotalActual = useMemo(
    () => metricas.reduce((max, m) => Math.max(max, m.totalPersonas ?? 0), 0),
    [metricas]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.estado) return toast.error('Selecciona un estado')
    const total = Number(form.totalPersonas) || 0
    // El percentil se recalcula contra el máximo INCLUYENDO este registro,
    // igual que hace MetricasService.parsearCSV en Flutter (primera pasada
    // lee todos los totales antes de asignar el nivel).
    const maxConEste = Math.max(maxTotalActual, total)
    const nivel = nivelPorPercentil(total, maxConEste)
    setSaving(true)
    try {
      const id = idDeEstado(form.estado)
      await guardarMetricaEstado(id, {
        estado: form.estado,
        totalPersonas: total,
        desaparecidos: Number(form.desaparecidos) || 0,
        encontrados: Number(form.encontrados) || 0,
        enHospital: Number(form.enHospital) || 0,
        enRefugio: Number(form.enRefugio) || 0,
        nivel,
      })
      toast.success(editId ? 'Métrica actualizada' : 'Métrica registrada')
      reset()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (m) => {
    setEditId(m.id)
    setForm({
      estado: m.estado ?? '', totalPersonas: m.totalPersonas ?? '',
      desaparecidos: m.desaparecidos ?? '', encontrados: m.encontrados ?? '',
      enHospital: m.enHospital ?? '', enRefugio: m.enRefugio ?? '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar la métrica de este estado?')) return
    await eliminarMetricaEstado(id)
    toast.success('Métrica eliminada')
  }

  // Recalcula el nivel de impacto de TODOS los estados ya cargados, por si
  // se agregó/editó uno y el percentil relativo cambió para el resto —
  // mismo criterio de MetricasService.parsearCSV (percentil sobre el máximo
  // del conjunto completo).
  const handleRecalcularNiveles = async () => {
    if (metricas.length === 0) return
    setRecalculando(true)
    try {
      const max = metricas.reduce((m, x) => Math.max(m, x.totalPersonas ?? 0), 0)
      const actualizados = metricas.map(m => ({
        id: m.id,
        estado: m.estado,
        totalPersonas: m.totalPersonas ?? 0,
        desaparecidos: m.desaparecidos ?? 0,
        encontrados: m.encontrados ?? 0,
        enHospital: m.enHospital ?? 0,
        enRefugio: m.enRefugio ?? 0,
        nivel: nivelPorPercentil(m.totalPersonas ?? 0, max),
      }))
      await guardarMetricasEnLote(actualizados)
      toast.success('Niveles de impacto recalculados')
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setRecalculando(false)
    }
  }

  const ordenadas = [...metricas].sort((a, b) => (b.totalPersonas ?? 0) - (a.totalPersonas ?? 0))

  return (
    <div className="page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <PieChart size={20} className="text-orange-400" />
            Métricas por estado
          </h1>
          <p className="text-sm text-slate-500">
            Venezuela Te Busca — colección <code className="text-slate-400">metricas_estados</code>, consumida por la capa de impacto del mapa en la app.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRecalcularNiveles} disabled={recalculando || metricas.length === 0} className="btn-secondary">
            {recalculando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Recalcular niveles
          </button>
          <button onClick={() => { reset(); setShowForm(s => !s) }} className="btn-primary">
            <Plus size={15} /> {showForm ? 'Cerrar formulario' : 'Cargar estado'}
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2">
              {editId ? <Pencil size={14} className="text-orange-400" /> : <Plus size={14} className="text-orange-400" />}
              {editId ? 'Editar métrica' : 'Cargar métrica de un estado'}
            </span>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <X size={12} /> Cancelar
            </button>
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="label">Estado de Venezuela *</label>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)} disabled={!!editId}>
                <option value="">Selecciona un estado...</option>
                {estadosDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {editId && <p className="text-xs text-slate-600 mt-1">El estado no se puede cambiar al editar — elimina y vuelve a crear si es necesario.</p>}
            </div>
            <div>
              <label className="label">Total registradas *</label>
              <input className="input" value={form.totalPersonas} onChange={e => set('totalPersonas', e.target.value)} placeholder="0" inputMode="numeric" />
            </div>
            <div>
              <label className="label">Desaparecidos *</label>
              <input className="input" value={form.desaparecidos} onChange={e => set('desaparecidos', e.target.value)} placeholder="0" inputMode="numeric" />
            </div>
            <div>
              <label className="label">Localizados *</label>
              <input className="input" value={form.encontrados} onChange={e => set('encontrados', e.target.value)} placeholder="0" inputMode="numeric" />
            </div>
            <div>
              <label className="label">En hospital <span className="text-slate-600">(opcional)</span></label>
              <input className="input" value={form.enHospital} onChange={e => set('enHospital', e.target.value)} placeholder="0" inputMode="numeric" />
            </div>
            <div>
              <label className="label">En refugio <span className="text-slate-600">(opcional)</span></label>
              <input className="input" value={form.enRefugio} onChange={e => set('enRefugio', e.target.value)} placeholder="0" inputMode="numeric" />
            </div>
            <div className="md:col-span-3">
              <p className="text-xs text-slate-600 mb-3">
                El nivel de impacto (🔴 crítico → ⚪ mínimo) se calcula automáticamente por percentil sobre el total más alto registrado — mismo criterio que la carga CSV desde la app.
              </p>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Cargar métrica'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      {ordenadas.length === 0 ? (
        <div className="card p-12 text-center">
          <PieChart size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Sin métricas cargadas aún</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-medium text-slate-200">Estados cargados ({ordenadas.length} / 24)</h2>
          </div>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-500 border-b border-slate-800">
                  <th className="text-left font-medium px-4 py-2.5">Estado</th>
                  <th className="text-center font-medium px-3 py-2.5">Nivel</th>
                  <th className="text-center font-medium px-3 py-2.5">Total</th>
                  <th className="text-center font-medium px-3 py-2.5">Desaparecidos</th>
                  <th className="text-center font-medium px-3 py-2.5">Localizados</th>
                  <th className="text-right font-medium px-4 py-2.5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ordenadas.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-medium text-slate-200">{m.estado}</td>
                    <td className="px-3 py-2.5 text-center"><NivelImpactoBadge nivel={m.nivel} /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">{m.totalPersonas ?? 0}</td>
                    <td className="px-3 py-2.5 text-center text-red-400">{m.desaparecidos ?? 0}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-400">{m.encontrados ?? 0}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => handleEdit(m)} className="btn-secondary text-xs gap-1 py-1"><Pencil size={11} /></button>
                        <button onClick={() => handleDelete(m.id)} className="btn-danger text-xs gap-1 py-1"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
