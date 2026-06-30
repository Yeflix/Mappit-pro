// src/constants/personas.js
// Espejo EXACTO de los enums definidos en la app Flutter
// (lib/rescate_unidos/models/persona.dart y models/metrica_estado.dart).
// No cambiar los `valor` sin actualizar también Flutter.

// ─── PERSONA · EstadoPersona ───────────────────────────────────────────────────
export const ESTADOS_PERSONA = [
  { valor: 'desaparecida', emoji: '🔴', etiqueta: 'Desaparecida', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { valor: 'encontrada',   emoji: '🟢', etiqueta: 'Encontrada',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { valor: 'en_hospital',  emoji: '🏥', etiqueta: 'En hospital',  cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { valor: 'en_refugio',   emoji: '🏠', etiqueta: 'En refugio',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
]
export const estadoPersona = (v) => ESTADOS_PERSONA.find(e => e.valor === v) ?? ESTADOS_PERSONA[0]
export const ESTADOS_PERSONA_ENCONTRADA = ['encontrada', 'en_hospital', 'en_refugio']

export const SEXOS_PERSONA = [
  { valor: 'M',     etiqueta: 'M' },
  { valor: 'F',     etiqueta: 'F' },
  { valor: 'Otro',  etiqueta: 'Otro' },
]

// ─── MÉTRICA ESTADO · NivelImpacto ─────────────────────────────────────────────
export const NIVELES_IMPACTO = [
  { valor: 'critico',  emoji: '🔴', etiqueta: 'Crítico',  cls: 'bg-red-900/30 text-red-300 border-red-700/40' },
  { valor: 'alto',     emoji: '🟠', etiqueta: 'Alto',     cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { valor: 'moderado', emoji: '🟡', etiqueta: 'Moderado', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { valor: 'bajo',     emoji: '🟢', etiqueta: 'Bajo',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { valor: 'minimo',   emoji: '⚪', etiqueta: 'Mínimo',   cls: 'bg-slate-700/40 text-slate-400 border-slate-600' },
]
export const nivelImpacto = (v) => NIVELES_IMPACTO.find(n => n.valor === v) ?? NIVELES_IMPACTO[4]

// ─── ID de documento para metricas_estados (espejo de MetricaEstado.idDeEstado) ─
const ACENTOS = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
  'ñ': 'n', 'Ñ': 'n', 'ü': 'u', 'Ü': 'u',
}
export const idDeEstado = (estado) => {
  let r = (estado ?? '').toLowerCase().trim()
  for (const [k, v] of Object.entries(ACENTOS)) r = r.replaceAll(k, v)
  return r.replaceAll(' ', '_')
}

// Calcula el nivel de impacto por percentil sobre el máximo de totalPersonas
// del conjunto — mismo criterio que NivelImpacto.fromPercentil en Flutter.
export const nivelPorPercentil = (totalPersonas, maxTotal) => {
  if (!maxTotal) return 'minimo'
  const pct = totalPersonas / maxTotal
  if (pct >= 0.75) return 'critico'
  if (pct >= 0.50) return 'alto'
  if (pct >= 0.25) return 'moderado'
  if (pct >= 0.05) return 'bajo'
  return 'minimo'
}
