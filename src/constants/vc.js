// src/constants/vc.js
// Espejo EXACTO de los enums definidos en la app Flutter
// (lib/venezuela_conecta/models/recurso.dart). No cambiar los `valor`
// sin actualizar también Flutter.
//
// `MODERACIONES` (pendiente/aprobado/rechazado) se reutiliza directamente
// desde constants/rescate.js — Recurso usa los mismos tres valores.

// ─── RECURSO · CategoriaRecurso ───────────────────────────────────────────────
export const CATEGORIAS_RECURSO = [
  { valor: 'ayuda_humanitaria',  emoji: '🤝',  etiqueta: 'Ayuda humanitaria' },
  { valor: 'salud',              emoji: '🏥',  etiqueta: 'Salud' },
  { valor: 'economia',           emoji: '💰',  etiqueta: 'Economía y finanzas' },
  { valor: 'remesas',            emoji: '💸',  etiqueta: 'Remesas y pagos' },
  { valor: 'noticias',           emoji: '📰',  etiqueta: 'Noticias verificadas' },
  { valor: 'empleo',             emoji: '💼',  etiqueta: 'Empleo y oportunidades' },
  { valor: 'educacion',          emoji: '📚',  etiqueta: 'Educación' },
  { valor: 'servicios_publicos', emoji: '🏛️', etiqueta: 'Servicios públicos' },
  { valor: 'transporte',         emoji: '🚌',  etiqueta: 'Transporte' },
  { valor: 'tecnologia',         emoji: '💻',  etiqueta: 'Tecnología' },
  { valor: 'comunidad',          emoji: '👥',  etiqueta: 'Comunidad' },
  { valor: 'otro',               emoji: '🔗',  etiqueta: 'Otro' },
]
export const categoriaRecurso = (v) =>
  CATEGORIAS_RECURSO.find(c => c.valor === v) ?? CATEGORIAS_RECURSO[CATEGORIAS_RECURSO.length - 1]

// ─── RECURSO · PlataformaRecurso ──────────────────────────────────────────────
export const PLATAFORMAS_RECURSO = [
  { valor: 'web',       emoji: '🌐', etiqueta: 'Web' },
  { valor: 'telegram',  emoji: '✈️', etiqueta: 'Telegram' },
  { valor: 'whatsapp',  emoji: '💬', etiqueta: 'WhatsApp' },
  { valor: 'instagram', emoji: '📷', etiqueta: 'Instagram' },
  { valor: 'twitter',   emoji: '🐦', etiqueta: 'Twitter / X' },
  { valor: 'youtube',   emoji: '▶️', etiqueta: 'YouTube' },
  { valor: 'facebook',  emoji: '📘', etiqueta: 'Facebook' },
  { valor: 'otro',      emoji: '🔗', etiqueta: 'Otro' },
]
export const plataformaRecurso = (v) =>
  PLATAFORMAS_RECURSO.find(p => p.valor === v) ?? PLATAFORMAS_RECURSO[PLATAFORMAS_RECURSO.length - 1]
