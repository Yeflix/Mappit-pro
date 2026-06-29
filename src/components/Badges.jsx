// src/components/Badges.jsx
import { estadoOperativo, verificacion, estadoReporte, tipoAlerta, nivelUrgencia, severidad, MODERACIONES } from '../constants/rescate'

export function EstadoPuntoBadge({ estado }) {
  const e = estadoOperativo(estado)
  return <span className={`badge ${e.cls}`}>{e.emoji} {e.etiqueta}</span>
}

export function VerificacionBadge({ verificacion: v }) {
  const x = verificacion(v)
  return <span className={`badge ${x.cls}`}>{x.emoji} {x.etiqueta}</span>
}

export function UrgenciaBadge({ urgencia }) {
  const u = nivelUrgencia(urgencia)
  return <span className={`badge ${u.cls}`}>{u.etiqueta}</span>
}

export function ModeracionBadge({ estado }) {
  const m = MODERACIONES[estado] ?? MODERACIONES.pendiente
  return <span className={`badge ${m.cls}`}>{m.etiqueta}</span>
}

export function EstadoReporteBadge({ estado }) {
  const e = estadoReporte(estado)
  return <span className={`badge ${e.cls}`}>{e.emoji} {e.etiqueta}</span>
}

export function SeveridadBadge({ severidad: s }) {
  const x = severidad(s)
  return <span className={`badge ${x.cls}`}>{x.etiqueta}</span>
}

export function TipoAlertaBadge({ tipo }) {
  return <span className="text-base">{tipoAlerta(tipo).emoji}</span>
}

// Recurso.verificado es booleano (no el enum de 3 niveles que usa puntos_ayuda)
export function VerificadoRecursoBadge({ verificado }) {
  return verificado
    ? <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/30">✅ Verificado</span>
    : <span className="badge bg-slate-700/40 text-slate-400 border-slate-600">— Sin verificar</span>
}
