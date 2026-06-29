// src/constants/rescate.js
// Espejo EXACTO de los enums y valores Firestore definidos en la app Flutter
// (lib/models/*.dart). No cambiar los `valor` sin actualizar también Flutter.

// ─── ESTADOS DE VENEZUELA ─────────────────────────────────────────────────────
export const ESTADOS_VE = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
  'Cojedes', 'Delta Amacuro', 'Dependencias Federales', 'Distrito Capital',
  'Falcón', 'Guárico', 'La Guaira', 'Lara', 'Mérida', 'Miranda', 'Monagas',
  'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Yaracuy', 'Zulia',
]

// ─── PUNTO DE AYUDA · TipoPunto ───────────────────────────────────────────────
export const TIPOS_PUNTO = [
  { valor: 'acopio',               emoji: '📦',  etiqueta: 'Punto de acopio' },
  { valor: 'refugio',              emoji: '🏠',  etiqueta: 'Refugio / Albergue' },
  { valor: 'medico',               emoji: '🏥',  etiqueta: 'Servicio médico' },
  { valor: 'agua',                 emoji: '💧',  etiqueta: 'Punto de agua' },
  { valor: 'alimentos',            emoji: '🍽️', etiqueta: 'Alimentos' },
  { valor: 'distribucion_insumos', emoji: '🚚',  etiqueta: 'Distribución de insumos' },
  { valor: 'punto_informacion',    emoji: 'ℹ️',  etiqueta: 'Información' },
  { valor: 'servicio_voluntario',  emoji: '🤝',  etiqueta: 'Servicio / Donación voluntaria' },
  { valor: 'otro',                 emoji: '❓',  etiqueta: 'Otro' },
]
export const tipoPunto = (v) => TIPOS_PUNTO.find(t => t.valor === v) ?? TIPOS_PUNTO[6]

// ─── PUNTO DE AYUDA · EstadoOperativo ─────────────────────────────────────────
export const ESTADOS_OPERATIVOS = [
  { valor: 'operativo',           etiqueta: 'Operativo',           emoji: '🟢', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { valor: 'saturado',            etiqueta: 'Saturado',            emoji: '🟡', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { valor: 'cerrado',             etiqueta: 'Cerrado',             emoji: '🔴', cls: 'bg-slate-700 text-slate-400 border-slate-600' },
  { valor: 'necesita_donaciones', etiqueta: 'Necesita donaciones', emoji: '🟠', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
]
export const estadoOperativo = (v) => ESTADOS_OPERATIVOS.find(e => e.valor === v) ?? ESTADOS_OPERATIVOS[0]

// ─── PUNTO DE AYUDA · NivelUrgencia ───────────────────────────────────────────
export const NIVELES_URGENCIA = [
  { valor: 'critica',     etiqueta: 'Crítica',     prioridad: 0, cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { valor: 'alta',        etiqueta: 'Alta',        prioridad: 1, cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { valor: 'media',       etiqueta: 'Media',       prioridad: 2, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { valor: 'informativa', etiqueta: 'Informativa', prioridad: 3, cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
]
export const nivelUrgencia = (v) => NIVELES_URGENCIA.find(n => n.valor === v) ?? NIVELES_URGENCIA[3]

// ─── PUNTO DE AYUDA · Verificacion ────────────────────────────────────────────
export const VERIFICACIONES = [
  { valor: 'oficial',               etiqueta: 'Verificado oficialmente', emoji: '✅', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { valor: 'voluntario_verificado', etiqueta: 'Voluntario verificado',   emoji: '🔵', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { valor: 'comunidad',             etiqueta: 'Reportado por comunidad',  emoji: '👥', cls: 'bg-slate-700/40 text-slate-400 border-slate-600' },
]
export const verificacion = (v) => VERIFICACIONES.find(x => x.valor === v) ?? VERIFICACIONES[2]

// ─── PUNTO DE AYUDA · estadoModeracion ────────────────────────────────────────
export const MODERACIONES = {
  pendiente: { etiqueta: 'Pendiente', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  aprobado:  { etiqueta: 'Aprobado',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rechazado: { etiqueta: 'Rechazado', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

// Necesidades sugeridas (texto libre en Flutter, lista de chips aquí)
export const NECESIDADES_COMUNES = [
  'agua', 'alimentos', 'medicinas', 'voluntarios', 'pañales', 'ropa',
  'colchones', 'higiene', 'transporte', 'combustible',
]

// ─── REPORTE URGENTE · TipoReporteUrgente ─────────────────────────────────────
export const TIPOS_REPORTE = [
  { valor: 'persona_atrapada',            emoji: '🆘', etiqueta: 'Persona atrapada' },
  { valor: 'necesita_rescate_inmediato',  emoji: '🚨', etiqueta: 'Necesita rescate inmediato' },
  { valor: 'emergencia_medica',           emoji: '🏥', etiqueta: 'Emergencia médica' },
  { valor: 'otro',                        emoji: '❗', etiqueta: 'Otro' },
]
export const tipoReporte = (v) => TIPOS_REPORTE.find(t => t.valor === v) ?? TIPOS_REPORTE[1]

// ─── REPORTE URGENTE · EstadoReporte ──────────────────────────────────────────
export const ESTADOS_REPORTE = [
  { valor: 'reportado',          emoji: '🆘', etiqueta: 'Reportado',           cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { valor: 'en_atencion',        emoji: '🚑', etiqueta: 'En atención',         cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { valor: 'resuelto_rescatado', emoji: '✓',  etiqueta: 'Resuelto — Rescatado', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { valor: 'resuelto_sin_vida',  emoji: '—',  etiqueta: 'Resuelto — Sin vida',  cls: 'bg-slate-500/10 text-slate-400 border-slate-600' },
  { valor: 'no_confirmado',      emoji: '?',  etiqueta: 'No confirmado',        cls: 'bg-slate-700/30 text-slate-500 border-slate-700' },
]
export const estadoReporte = (v) => ESTADOS_REPORTE.find(e => e.valor === v) ?? ESTADOS_REPORTE[0]

// ─── ALERTA OFICIAL · TipoAlerta ──────────────────────────────────────────────
export const TIPOS_ALERTA = [
  { valor: 'replica_sismica',         emoji: '🌍',  etiqueta: 'Réplica sísmica' },
  { valor: 'corte_servicio',          emoji: '⚡',  etiqueta: 'Corte de servicio' },
  { valor: 'via_bloqueada',           emoji: '🚧',  etiqueta: 'Vía bloqueada' },
  { valor: 'zona_peligro',            emoji: '⚠️',  etiqueta: 'Zona de peligro' },
  { valor: 'cierre_aeropuerto',       emoji: '✈️',  etiqueta: 'Cierre de aeropuerto' },
  { valor: 'convocatoria_voluntarios', emoji: '🤝', etiqueta: 'Convocatoria de voluntarios' },
  { valor: 'nuevo_punto_ayuda',       emoji: '📍',  etiqueta: 'Nuevo punto de ayuda' },
  { valor: 'nuevo_donante_servicio',  emoji: '💙',  etiqueta: 'Nuevo donante / servicio' },
  { valor: 'enlace_externo',          emoji: '🔗',  etiqueta: 'Enlace externo' },
  { valor: 'noticia_general',         emoji: '📰',  etiqueta: 'Noticia' },
]
export const tipoAlerta = (v) => TIPOS_ALERTA.find(t => t.valor === v) ?? TIPOS_ALERTA[9]

// ─── ALERTA OFICIAL · NivelImportancia ────────────────────────────────────────
export const NIVELES_IMPORTANCIA = [
  { valor: 'critica',     etiqueta: 'Crítica (push inmediato)', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { valor: 'alta',        etiqueta: 'Alta',                     cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { valor: 'media',       etiqueta: 'Media',                    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { valor: 'informativa', etiqueta: 'Informativa',              cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
]
export const nivelImportancia = (v) => NIVELES_IMPORTANCIA.find(n => n.valor === v) ?? NIVELES_IMPORTANCIA[3]

// ─── ZONA DE IMPACTO · SeveridadSismica ───────────────────────────────────────
export const SEVERIDADES = [
  { valor: 'sin_danos', etiqueta: 'Sin daños',       nivel: 0, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { valor: 'leve',      etiqueta: 'Daños leves',     nivel: 1, cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { valor: 'moderado',  etiqueta: 'Daños moderados', nivel: 2, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { valor: 'grave',     etiqueta: 'Daños graves',    nivel: 3, cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { valor: 'critico',   etiqueta: 'Zona crítica',    nivel: 4, cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
]
export const severidad = (v) => SEVERIDADES.find(s => s.valor === v) ?? SEVERIDADES[0]

export const SERVICIOS_AFECTADOS = ['agua', 'electricidad', 'gas', 'internet', 'telefonia', 'vialidad']

// ─── CONFIRMACION COMUNIDAD · TipoConfirmacion ────────────────────────────────
export const TIPOS_CONFIRMACION = {
  sigue_activo:           { emoji: '✅', etiqueta: 'Sigue activo',           revision: false },
  ya_no_hay_insumos:      { emoji: '📦', etiqueta: 'Ya no hay insumos',      revision: false },
  cerrado:                { emoji: '🔴', etiqueta: 'Cerrado',                revision: true },
  necesita_mas_ayuda:     { emoji: '🆘', etiqueta: 'Necesita más ayuda',     revision: false },
  informacion_incorrecta: { emoji: '❌', etiqueta: 'Información incorrecta', revision: true },
}
