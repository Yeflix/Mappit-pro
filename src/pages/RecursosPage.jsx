import { useEffect, useState } from 'react'
import {
  subscribeRecursos, crearRecursoDirecto, editarRecurso,
  cambiarVerificadoRecurso, eliminarRecurso,
} from '../services/firestoreService'
import { CATEGORIAS_RECURSO, categoriaRecurso, PLATAFORMAS_RECURSO, plataformaRecurso } from '../constants/vc'
import { VerificadoRecursoBadge } from '../components/Badges'
import { useAuth } from '../context/AuthContext'
import {
  Globe, Plus, Trash2, Search, ExternalLink, ShieldCheck, ShieldOff,
  Pencil, X, Check, MousePointerClick, Mail,
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  nombre: '', descripcion: '', url: '',
  categoria: 'comunidad', plataforma: 'web',
}

export default function RecursosPage() {
  const { user } = useAuth()
  const [recursos,  setRecursos]  = useState([])
  const [form,       setForm]     = useState(EMPTY)
  const [saving,      setSaving]  = useState(false)
  const [busqueda,  setBusqueda]  = useState('')
  const [catFil,      setCatFil]  = useState('')
  const [platFil,    setPlatFil]  = useState('')
  const [verifFil,  setVerifFil]  = useState('')

  useEffect(() => subscribeRecursos(setRecursos, {}, (err) => {
    toast.error('No se pudieron cargar los recursos: ' + err.message)
  }), [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio')
    if (!form.url.trim()) return toast.error('La URL es obligatoria')
    setSaving(true)
    try {
      await crearRecursoDirecto({
        ...form,
        creadoPorUid: user?.uid,
        creadoPorEmail: user?.email,
      })
      toast.success('Recurso publicado en VenezuelaConecta ✓')
      setForm(EMPTY)
    } catch (err) { toast.error('Error al publicar: ' + err.message) }
    finally { setSaving(false) }
  }

  const filtrados = recursos.filter(r => {
    const q = busqueda.toLowerCase()
    if (q && !r.nombre?.toLowerCase().includes(q) && !r.descripcion?.toLowerCase().includes(q)) return false
    if (catFil && r.categoria !== catFil) return false
    if (platFil && r.plataforma !== platFil) return false
    if (verifFil === 'si' && !r.verificado) return false
    if (verifFil === 'no' && r.verificado) return false
    return true
  })

  const verificados = recursos.filter(r => r.verificado).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Globe size={20} className="text-sky-400" />
          Recursos · VenezuelaConecta
        </h1>
        <p className="text-sm text-slate-500">
          {recursos.length} publicados · {verificados} verificados — directorio de links y contactos útiles que se muestra en la app
        </p>
      </div>

      {/* Formulario: publicar directo */}
      <div className="card p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Plus size={14} className="text-sky-400" /> Publicar recurso directo
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nombre *</label>
            <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: Fundación X — apoyo alimentario" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input min-h-16 resize-y" value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)} placeholder="Qué ofrece, a quién, cómo contactar..." />
          </div>
          <div className="md:col-span-2">
            <label className="label">URL *</label>
            <input className="input" value={form.url} onChange={e => set('url', e.target.value)}
              placeholder="https://... o t.me/... o wa.me/..." />
          </div>
          <div>
            <label className="label">Categoría *</label>
            <select className="input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
              {CATEGORIAS_RECURSO.map(c => <option key={c.valor} value={c.valor}>{c.emoji} {c.etiqueta}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Plataforma *</label>
            <select className="input" value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>
              {PLATAFORMAS_RECURSO.map(p => <option key={p.valor} value={p.valor}>{p.emoji} {p.etiqueta}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              <Plus size={15} /> {saving ? 'Publicando...' : 'Publicar — quedará verificado y visible'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-8 h-8 text-xs" placeholder="Buscar por nombre o descripción..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="input h-8 text-xs w-48" value={catFil} onChange={e => setCatFil(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS_RECURSO.map(c => <option key={c.valor} value={c.valor}>{c.emoji} {c.etiqueta}</option>)}
        </select>
        <select className="input h-8 text-xs w-40" value={platFil} onChange={e => setPlatFil(e.target.value)}>
          <option value="">Toda plataforma</option>
          {PLATAFORMAS_RECURSO.map(p => <option key={p.valor} value={p.valor}>{p.emoji} {p.etiqueta}</option>)}
        </select>
        <select className="input h-8 text-xs w-40" value={verifFil} onChange={e => setVerifFil(e.target.value)}>
          <option value="">Verificado: todos</option>
          <option value="si">Solo verificados</option>
          <option value="no">Solo sin verificar</option>
        </select>
        {(busqueda || catFil || platFil || verifFil) && (
          <button onClick={() => { setBusqueda(''); setCatFil(''); setPlatFil(''); setVerifFil('') }}
            className="text-xs text-slate-500 hover:text-slate-300">Limpiar</button>
        )}
      </div>

      {/* Listado */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <Globe size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {recursos.length === 0 ? 'Sin recursos publicados aún' : 'Sin resultados para los filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => <RecursoCard key={r.id} recurso={r} />)}
        </div>
      )}
    </div>
  )
}

function RecursoCard({ recurso: r }) {
  const [editando, setEditando] = useState(false)
  const [edit, setEdit] = useState(r)
  const [busy, setBusy] = useState(false)
  const c = categoriaRecurso(r.categoria)
  const p = plataformaRecurso(r.plataforma)
  const ts = r.creadoEn?.toDate?.()

  const startEdit = () => { setEdit(r); setEditando(true) }
  const cancelEdit = () => setEditando(false)

  const guardar = async () => {
    if (!edit.nombre?.trim() || !edit.url?.trim()) return toast.error('Nombre y URL son obligatorios')
    setBusy(true)
    try {
      await editarRecurso(r.id, {
        nombre: edit.nombre, descripcion: edit.descripcion || '',
        url: edit.url, categoria: edit.categoria, plataforma: edit.plataforma,
      })
      toast.success('Recurso actualizado')
      setEditando(false)
    } catch (e) { toast.error('Error: ' + e.message) }
    setBusy(false)
  }

  const toggleVerificado = async () => {
    try {
      await cambiarVerificadoRecurso(r.id, !r.verificado)
      toast.success(r.verificado ? 'Verificación retirada' : 'Recurso verificado ✓')
    } catch (e) { toast.error('Error: ' + e.message) }
  }

  const borrar = async () => {
    if (!confirm(`¿Eliminar "${r.nombre}" permanentemente?`)) return
    try {
      await eliminarRecurso(r.id)
      toast.success('Recurso eliminado')
    } catch (e) { toast.error('Error al eliminar: ' + e.message) }
  }

  if (editando) {
    return (
      <div className="card border border-sky-500/30 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nombre</label>
            <input className="input" value={edit.nombre} onChange={e => setEdit(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input min-h-14 resize-y" value={edit.descripcion || ''}
              onChange={e => setEdit(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">URL</label>
            <input className="input" value={edit.url} onChange={e => setEdit(p => ({ ...p, url: e.target.value }))} />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input" value={edit.categoria} onChange={e => setEdit(p => ({ ...p, categoria: e.target.value }))}>
              {CATEGORIAS_RECURSO.map(c => <option key={c.valor} value={c.valor}>{c.emoji} {c.etiqueta}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Plataforma</label>
            <select className="input" value={edit.plataforma} onChange={e => setEdit(p => ({ ...p, plataforma: e.target.value }))}>
              {PLATAFORMAS_RECURSO.map(p => <option key={p.valor} value={p.valor}>{p.emoji} {p.etiqueta}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={cancelEdit} className="btn-secondary text-xs py-1.5"><X size={12} /> Cancelar</button>
          <button onClick={guardar} disabled={busy} className="btn-primary text-xs py-1.5 disabled:opacity-50">
            <Check size={12} /> {busy ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`card overflow-hidden border px-4 py-3.5 ${r.verificado ? 'border-slate-800' : 'border-amber-500/20'}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-600/10 flex items-center justify-center flex-shrink-0 text-xl">{c.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200 truncate">{r.nombre}</p>
            <VerificadoRecursoBadge verificado={r.verificado} />
            <span className="badge bg-slate-700/40 text-slate-400 border-slate-600">{p.emoji} {p.etiqueta}</span>
          </div>
          {r.descripcion && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.descripcion}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[10px] text-slate-500">
            <span>{c.etiqueta}</span>
            <a href={r.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-0.5">
              <ExternalLink size={9} /> {r.url}
            </a>
            <span className="flex items-center gap-0.5"><MousePointerClick size={10} /> {r.clicks ?? 0} clics</span>
            {r.creadoPorEmail && <span className="flex items-center gap-0.5"><Mail size={10} /> {r.creadoPorEmail}</span>}
            {ts && <span>· {ts.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={toggleVerificado} title={r.verificado ? 'Quitar verificación' : 'Verificar'}
            className={r.verificado ? 'btn-warning text-xs py-1.5' : 'btn-success text-xs py-1.5'}>
            {r.verificado ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
          </button>
          <button onClick={startEdit} className="btn-secondary text-xs py-1.5"><Pencil size={12} /></button>
          <button onClick={borrar} className="btn-danger text-xs py-1.5"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}
