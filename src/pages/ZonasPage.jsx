import { useEffect, useState } from 'react'
import { subscribeZonas, crearZona, actualizarZona, eliminarZona } from '../services/firestoreService'
import { SEVERIDADES, severidad, ESTADOS_VE, SERVICIOS_AFECTADOS } from '../constants/rescate'
import { SeveridadBadge } from '../components/Badges'
import { Activity, Plus, Trash2, MapPin, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  nombre: '', estadoVenezuela: '', severidad: 'leve', descripcion: '', fuente: '',
  latitudCentro: '', longitudCentro: '', radioKm: '', poligonoJson: '',
  serviciosAfectados: [],
}

export default function ZonasPage() {
  const [zonas,   setZonas]   = useState([])
  const [form,    setForm]    = useState(EMPTY)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => subscribeZonas(setZonas), [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleServicio = (s) => setForm(p => ({
    ...p,
    serviciosAfectados: p.serviciosAfectados.includes(s)
      ? p.serviciosAfectados.filter(x => x !== s)
      : [...p.serviciosAfectados, s],
  }))

  const reset = () => { setForm(EMPTY); setEditId(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.estadoVenezuela) return toast.error('Nombre y estado son obligatorios')
    setSaving(true)
    // Parse optional polygon JSON
    let poligono = null
    if (form.poligonoJson.trim()) {
      try {
        poligono = JSON.parse(form.poligonoJson)
        if (!Array.isArray(poligono)) throw new Error('Debe ser un arreglo')
      } catch (err) {
        toast.error('El polígono no es un JSON válido: ' + err.message)
        setSaving(false)
        return
      }
    }
    const payload = {
      nombre: form.nombre.trim(),
      estadoVenezuela: form.estadoVenezuela,
      severidad: form.severidad,
      descripcion: form.descripcion,
      fuente: form.fuente,
      latitudCentro: form.latitudCentro === '' ? null : Number(form.latitudCentro),
      longitudCentro: form.longitudCentro === '' ? null : Number(form.longitudCentro),
      radioKm: form.radioKm === '' ? null : Number(form.radioKm),
      poligono,
      serviciosAfectados: form.serviciosAfectados,
    }
    try {
      if (editId) { await actualizarZona(editId, payload); toast.success('Zona actualizada') }
      else { await crearZona(payload); toast.success('Zona registrada') }
      reset()
    } catch (err) { toast.error('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleEdit = (z) => {
    setEditId(z.id)
    setForm({
      nombre: z.nombre ?? '', estadoVenezuela: z.estadoVenezuela ?? '',
      severidad: z.severidad ?? 'leve', descripcion: z.descripcion ?? '', fuente: z.fuente ?? '',
      latitudCentro: z.latitudCentro ?? '', longitudCentro: z.longitudCentro ?? '',
      radioKm: z.radioKm ?? '',
      poligonoJson: z.poligono ? JSON.stringify(z.poligono, null, 2) : '',
      serviciosAfectados: z.serviciosAfectados ?? [],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta zona de impacto?')) return
    await eliminarZona(id)
    toast.success('Zona eliminada')
  }

  const ordenadas = [...zonas].sort((a, b) => severidad(b.severidad).nivel - severidad(a.severidad).nivel)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Activity size={20} className="text-orange-400" />
          Zonas de impacto
        </h1>
        <p className="text-sm text-slate-500">
          Severidad sísmica por zona. La app la usa para colorear el mapa y mostrar badges de daño.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="flex items-center gap-2">
            {editId ? <Pencil size={14} className="text-orange-400" /> : <Plus size={14} className="text-orange-400" />}
            {editId ? 'Editar zona' : 'Registrar nueva zona'}
          </span>
          {editId && <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"><X size={12} /> Cancelar</button>}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre de la zona *</label>
            <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Municipio Vargas, Petare..." />
          </div>
          <div>
            <label className="label">Estado de Venezuela *</label>
            <select className="input" value={form.estadoVenezuela} onChange={e => set('estadoVenezuela', e.target.value)}>
              <option value="">Selecciona un estado...</option>
              {ESTADOS_VE.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Severidad *</label>
            <select className="input" value={form.severidad} onChange={e => set('severidad', e.target.value)}>
              {SEVERIDADES.map(s => <option key={s.valor} value={s.valor}>{s.etiqueta}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fuente <span className="text-slate-600">(opcional)</span></label>
            <input className="input" value={form.fuente} onChange={e => set('fuente', e.target.value)} placeholder="Ej: FUNVISIS, Cruz Roja..." />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción del daño</label>
            <textarea className="input min-h-16 resize-y" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Resumen del estado de la zona..." />
          </div>
          <div>
            <label className="label">Latitud centro <span className="text-slate-600">(opcional)</span></label>
            <input className="input" value={form.latitudCentro} onChange={e => set('latitudCentro', e.target.value)} placeholder="10.6" inputMode="decimal" />
          </div>
          <div>
            <label className="label">Longitud centro <span className="text-slate-600">(opcional)</span></label>
            <input className="input" value={form.longitudCentro} onChange={e => set('longitudCentro', e.target.value)} placeholder="-66.9" inputMode="decimal" />
          </div>
          <div>
            <label className="label">Radio aproximado (km) <span className="text-slate-600">(opcional)</span></label>
            <input className="input" value={form.radioKm} onChange={e => set('radioKm', e.target.value)} placeholder="Ej: 5" inputMode="decimal" />
            <p className="text-xs text-slate-600 mt-1">Si se indica, la zona se dibuja como círculo en el mapa.</p>
          </div>
          <div className="md:col-span-2">
            <label className="label">Polígono (JSON) <span className="text-slate-600">(opcional — avanzado)</span></label>
            <textarea
              className="input min-h-20 resize-y font-mono text-xs"
              value={form.poligonoJson}
              onChange={e => set('poligonoJson', e.target.value)}
              placeholder={'[{"lat": 10.48, "lng": -66.87}, {"lat": 10.50, "lng": -66.85}, ...]'}
            />
            <p className="text-xs text-slate-600 mt-1">Arreglo de objetos <code className="text-slate-400">{"{lat, lng}"}</code>. Si se define, tiene prioridad sobre el radio.</p>
          </div>
          <div className="md:col-span-2">
            <label className="label">Servicios afectados</label>
            <div className="flex gap-1.5 flex-wrap">
              {SERVICIOS_AFECTADOS.map(s => {
                const on = form.serviciosAfectados.includes(s)
                return (
                  <button type="button" key={s} onClick={() => toggleServicio(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                      on ? 'bg-orange-600/20 text-orange-300 border-orange-500/40' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>{s}</button>
                )
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              <Plus size={15} /> {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Registrar zona'}
            </button>
          </div>
        </form>
      </div>

      {/* Listado */}
      {ordenadas.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Sin zonas de impacto registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ordenadas.map(z => (
            <div key={z.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{z.nombre}</p>
                  <p className="text-xs text-slate-500">{z.estadoVenezuela}</p>
                </div>
                <SeveridadBadge severidad={z.severidad} />
              </div>
              {z.descripcion && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{z.descripcion}</p>}
              {Array.isArray(z.serviciosAfectados) && z.serviciosAfectados.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {z.serviciosAfectados.map(s => <span key={s} className="badge bg-slate-700/40 text-slate-300 border-slate-600 capitalize">{s}</span>)}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                {z.latitudCentro != null && z.longitudCentro != null ? (
                  <a href={`https://maps.google.com/?q=${z.latitudCentro},${z.longitudCentro}`} target="_blank" rel="noreferrer"
                    className="text-xs text-primary-400 hover:underline flex items-center gap-1"><MapPin size={10} /> Ver mapa</a>
                ) : <span className="text-[10px] text-slate-600">{z.fuente ? `Fuente: ${z.fuente}` : 'Sin coordenadas'}</span>}
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(z)} className="btn-secondary text-xs gap-1.5 py-1"><Pencil size={11} /> Editar</button>
                  <button onClick={() => handleDelete(z.id)} className="btn-danger text-xs gap-1.5 py-1"><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
