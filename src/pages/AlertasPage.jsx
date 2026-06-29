import { useEffect, useState } from 'react'
import { subscribeAlertas, crearAlerta, eliminarAlerta } from '../services/firestoreService'
import {
  TIPOS_ALERTA, tipoAlerta, NIVELES_IMPORTANCIA, nivelImportancia, ESTADOS_VE,
} from '../constants/rescate'
import { Megaphone, Plus, Trash2, Search, Link as LinkIcon, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  tipo: 'noticia_general',
  titulo: '',
  descripcion: '',
  fuente: '',
  nivel: 'informativa',
  verificado: true,
  zonasAfectadas: [],
  enlaceExterno: '',
  expiraEn: '',
}

export default function AlertasPage() {
  const [alertas,  setAlertas]  = useState([])
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFil,  setTipoFil]  = useState('')

  useEffect(() => subscribeAlertas(setAlertas), [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleZona = (z) => setForm(p => ({
    ...p,
    zonasAfectadas: p.zonasAfectadas.includes(z)
      ? p.zonasAfectadas.filter(x => x !== z)
      : [...p.zonasAfectadas, z],
  }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) return toast.error('El título es obligatorio')
    if (form.zonasAfectadas.length === 0) return toast.error('Selecciona al menos una zona afectada')
    setSaving(true)
    try {
      await crearAlerta({
        ...form,
        enlaceExterno: form.enlaceExterno.trim() || null,
        expiraEn: form.expiraEn ? new Date(form.expiraEn) : null,
      })
      toast.success(form.nivel === 'critica'
        ? 'Alerta crítica publicada — se enviará push 🔔'
        : 'Alerta publicada en la app ✓')
      setForm(EMPTY)
    } catch (err) { toast.error('Error al publicar: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta alerta?')) return
    await eliminarAlerta(id)
    toast.success('Alerta eliminada')
  }

  const filtradas = alertas.filter(a => {
    const q = busqueda.toLowerCase()
    if (q && !a.titulo?.toLowerCase().includes(q) &&
            !(a.zonasAfectadas || []).join(' ').toLowerCase().includes(q)) return false
    if (tipoFil && a.tipo !== tipoFil) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Megaphone size={20} className="text-amber-400" />
          Alertas oficiales
        </h1>
        <p className="text-sm text-slate-500">
          Publicaciones del feed de Novedades. Las de nivel <span className="text-red-400">crítico</span> disparan push inmediato.
        </p>
      </div>

      {/* Formulario */}
      <div className="card p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Plus size={14} className="text-amber-400" /> Publicar nueva alerta
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de alerta *</label>
            <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {TIPOS_ALERTA.map(t => <option key={t.valor} value={t.valor}>{t.emoji} {t.etiqueta}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nivel de importancia *</label>
            <select className="input" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
              {NIVELES_IMPORTANCIA.map(n => <option key={n.valor} value={n.valor}>{n.etiqueta}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => set('titulo', e.target.value)}
              placeholder="Ej: Réplica de magnitud 4.2 registrada en La Guaira" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input min-h-16 resize-y" value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)} placeholder="Detalles de la alerta..." />
          </div>
          <div>
            <label className="label">Fuente <span className="text-slate-600">(opcional)</span></label>
            <input className="input" value={form.fuente} onChange={e => set('fuente', e.target.value)}
              placeholder="Ej: FUNVISIS, Protección Civil..." />
          </div>
          <div>
            <label className="label">Enlace externo <span className="text-slate-600">(opcional)</span></label>
            <input className="input" value={form.enlaceExterno} onChange={e => set('enlaceExterno', e.target.value)}
              placeholder="https://..." />
          </div>
          <div>
            <label className="label">Expira el <span className="text-slate-600">(opcional)</span></label>
            <input type="datetime-local" className="input" value={form.expiraEn} onChange={e => set('expiraEn', e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.verificado} onChange={e => set('verificado', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
              Marcar como verificada
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="label">Zonas afectadas * <span className="text-slate-600">({form.zonasAfectadas.length} seleccionadas)</span></label>
            <div className="flex gap-1.5 flex-wrap">
              {ESTADOS_VE.map(z => {
                const on = form.zonasAfectadas.includes(z)
                return (
                  <button type="button" key={z} onClick={() => toggleZona(z)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      on ? 'bg-amber-600/20 text-amber-300 border-amber-500/40' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>{z}</button>
                )
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              <Plus size={15} /> {saving ? 'Publicando...' : 'Publicar en la app'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-8 h-8 text-xs" placeholder="Buscar alertas..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="input h-8 text-xs w-48" value={tipoFil} onChange={e => setTipoFil(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS_ALERTA.map(t => <option key={t.valor} value={t.valor}>{t.emoji} {t.etiqueta}</option>)}
        </select>
        {(busqueda || tipoFil) && (
          <button onClick={() => { setBusqueda(''); setTipoFil('') }} className="text-xs text-slate-500 hover:text-slate-300">Limpiar</button>
        )}
      </div>

      {/* Listado */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-medium text-slate-200">
            Publicadas ({filtradas.length}{filtradas.length !== alertas.length ? ` de ${alertas.length}` : ''})
          </h2>
        </div>
        <div className="divide-y divide-slate-800">
          {filtradas.map(a => {
            const ti = tipoAlerta(a.tipo)
            const ni = nivelImportancia(a.nivel)
            const ts = a.creadoEn?.toDate?.()
            return (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 group">
                <span className="text-xl mt-0.5">{ti.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`badge ${ni.cls}`}>{ni.etiqueta}</span>
                    <span className="text-[10px] text-slate-600">{ti.etiqueta}</span>
                    {a.verificado && <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><ShieldCheck size={10} /> Verificada</span>}
                    {a.fuente && <span className="text-[10px] text-slate-500 italic">Fuente: {a.fuente}</span>}
                    {ts && <span className="text-[10px] text-slate-600">· {ts.toLocaleDateString('es', { day: '2-digit', month: 'short' })}</span>}
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{a.titulo}</p>
                  {a.descripcion && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.descripcion}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(a.zonasAfectadas || []).map(z => <span key={z} className="text-[10px] text-amber-400">{z}</span>)}
                    {a.enlaceExterno && (
                      <a href={a.enlaceExterno} target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"><LinkIcon size={9} /> enlace</a>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(a.id)}
                  className="btn-danger flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
          {filtradas.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-600">
              {alertas.length === 0 ? 'Sin alertas publicadas' : 'Sin resultados para los filtros'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
