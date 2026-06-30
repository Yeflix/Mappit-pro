import { useEffect, useState } from 'react'
import {
  subscribePersonas, crearPersona, editarPersona, marcarPersonaEncontrada,
  eliminarPersona, subscribeContadoresPersonas,
} from '../services/firestoreService'
import { ESTADOS_PERSONA, ESTADOS_PERSONA_ENCONTRADA, SEXOS_PERSONA } from '../constants/personas'
import { ESTADOS_VE } from '../constants/rescate'
import { PersonaBadge } from '../components/Badges'
import {
  Users, Plus, Trash2, Pencil, X, Search, CheckCircle2, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  nombre: '', cedula: '', edad: '', sexo: '', estado: 'desaparecida',
  ultimaUbicacion: '', estadoVenezolano: '', fotoUrl: '', descripcion: '',
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState([])
  const [contadores, setContadores] = useState({ total: 0, desaparecidos: 0, encontrados: 0 })
  const [filtro, setFiltro] = useState('desaparecida')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => subscribePersonas('todos', setPersonas), [])
  useEffect(() => subscribeContadoresPersonas(setContadores), [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const reset = () => { setForm(EMPTY); setEditId(null); setShowForm(false) }

  const contar = (key) => {
    if (key === 'desaparecida') return personas.filter(p => p.estado === 'desaparecida').length
    if (key === 'encontrada') return personas.filter(p => ESTADOS_PERSONA_ENCONTRADA.includes(p.estado)).length
    return personas.length
  }

  const filtradas = personas
    .filter(p => {
      if (filtro === 'desaparecida') return p.estado === 'desaparecida'
      if (filtro === 'encontrada') return ESTADOS_PERSONA_ENCONTRADA.includes(p.estado)
      return true
    })
    .filter(p => {
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return p.nombre?.toLowerCase().includes(q) || p.cedula?.toLowerCase().includes(q)
    })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.ultimaUbicacion.trim()) {
      return toast.error('Nombre y última ubicación son obligatorios')
    }
    if (form.fotoUrl.trim() && !form.fotoUrl.trim().startsWith('https://drive.google.com/')) {
      return toast.error('fotoUrl debe ser un enlace de Google Drive (https://drive.google.com/...)')
    }
    setSaving(true)
    try {
      if (editId) {
        await editarPersona(editId, form)
        toast.success('Persona actualizada')
      } else {
        await crearPersona({ ...form, reportadoPor: 'panel-web' })
        toast.success('Persona registrada')
      }
      reset()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (p) => {
    setEditId(p.id)
    setForm({
      nombre: p.nombre ?? '', cedula: p.cedula ?? '', edad: p.edad ?? '',
      sexo: p.sexo ?? '', estado: p.estado ?? 'desaparecida',
      ultimaUbicacion: p.ultimaUbicacion ?? '', estadoVenezolano: p.estadoVenezolano ?? '',
      fotoUrl: p.fotoUrl ?? '', descripcion: p.descripcion ?? '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro permanentemente?')) return
    await eliminarPersona(id)
    toast.success('Registro eliminado')
  }

  const handleMarcarEncontrado = async (p) => {
    const ubicacion = prompt('Ubicación donde fue encontrado/a (opcional):', '') || ''
    try {
      await marcarPersonaEncontrada(p.id, {
        estado: 'encontrada',
        encontradoPor: 'panel-web',
        ubicacionEncontrada: ubicacion,
      })
      toast.success(`${p.nombre} marcado/a como encontrado/a`)
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Users size={20} className="text-red-400" />
            Personas
          </h1>
          <p className="text-sm text-slate-500">
            Reportes individuales y carga masiva desde la app — colección <code className="text-slate-400">personas</code>.
          </p>
        </div>
        <button onClick={() => { reset(); setShowForm(s => !s) }} className="btn-primary">
          <Plus size={15} /> {showForm ? 'Cerrar formulario' : 'Registrar persona'}
        </button>
      </div>

      {/* Contadores globales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500">Total reportes</p>
          <p className="text-2xl font-semibold text-slate-100">{contadores.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Desaparecidos</p>
          <p className="text-2xl font-semibold text-red-400">{contadores.desaparecidos}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Localizados</p>
          <p className="text-2xl font-semibold text-emerald-400">{contadores.encontrados}</p>
        </div>
      </div>

      {/* Formulario (colapsable) */}
      {showForm && (
        <div className="card p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2">
              {editId ? <Pencil size={14} className="text-red-400" /> : <Plus size={14} className="text-red-400" />}
              {editId ? 'Editar persona' : 'Registrar nueva persona'}
            </span>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <X size={12} /> Cancelar
            </button>
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: María Pérez" />
            </div>
            <div>
              <label className="label">Última ubicación *</label>
              <input className="input" value={form.ultimaUbicacion} onChange={e => set('ultimaUbicacion', e.target.value)} placeholder="Ej: Hospital Vargas, La Guaira" />
            </div>
            <div>
              <label className="label">Cédula <span className="text-slate-600">(opcional)</span></label>
              <input className="input" value={form.cedula} onChange={e => set('cedula', e.target.value)} placeholder="V-12345678" />
            </div>
            <div>
              <label className="label">Estado de Venezuela <span className="text-slate-600">(opcional)</span></label>
              <select className="input" value={form.estadoVenezolano} onChange={e => set('estadoVenezolano', e.target.value)}>
                <option value="">Selecciona un estado...</option>
                {ESTADOS_VE.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Edad <span className="text-slate-600">(opcional, 0-120)</span></label>
              <input className="input" value={form.edad} onChange={e => set('edad', e.target.value)} placeholder="Ej: 34" inputMode="numeric" />
            </div>
            <div>
              <label className="label">Sexo <span className="text-slate-600">(opcional)</span></label>
              <select className="input" value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                <option value="">No especificado</option>
                {SEXOS_PERSONA.map(s => <option key={s.valor} value={s.valor}>{s.etiqueta}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado *</label>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
                {ESTADOS_PERSONA.map(e => <option key={e.valor} value={e.valor}>{e.emoji} {e.etiqueta}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Foto (enlace de Google Drive) <span className="text-slate-600">(opcional)</span></label>
              <input className="input" value={form.fotoUrl} onChange={e => set('fotoUrl', e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div className="md:col-span-2">
              <label className="label">Descripción <span className="text-slate-600">(opcional)</span></label>
              <textarea className="input min-h-16 resize-y" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Señas particulares, circunstancias..." />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Registrar persona'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros + búsqueda */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'desaparecida', label: 'Desaparecidos' },
            { key: 'encontrada', label: 'Localizados' },
            { key: 'todos', label: 'Todos' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filtro === key
                  ? 'bg-red-600/20 text-red-300 border-red-500/40'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}>
              {label}
              <span className="ml-1.5 text-slate-600">{key === 'todos' ? personas.length : contar(key)}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Listado */}
      {filtradas.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Sin registros en esta categoría</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-500 border-b border-slate-800">
                  <th className="text-left font-medium px-4 py-2.5">Nombre</th>
                  <th className="text-left font-medium px-3 py-2.5">Estado</th>
                  <th className="text-left font-medium px-3 py-2.5">Última ubicación</th>
                  <th className="text-left font-medium px-3 py-2.5">Estado VE</th>
                  <th className="text-right font-medium px-4 py-2.5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtradas.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-200">{p.nombre}</p>
                      {p.cedula && <p className="text-[10px] text-slate-600">{p.cedula}</p>}
                    </td>
                    <td className="px-3 py-2.5"><PersonaBadge estado={p.estado} /></td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[220px] truncate">{p.ultimaUbicacion}</td>
                    <td className="px-3 py-2.5 text-slate-400">{p.estadoVenezolano ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {p.estado === 'desaparecida' && (
                          <button onClick={() => handleMarcarEncontrado(p)} className="btn-success text-xs gap-1 py-1">
                            <CheckCircle2 size={11} /> Encontrado
                          </button>
                        )}
                        <button onClick={() => handleEdit(p)} className="btn-secondary text-xs gap-1 py-1"><Pencil size={11} /></button>
                        <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs gap-1 py-1"><Trash2 size={11} /></button>
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
