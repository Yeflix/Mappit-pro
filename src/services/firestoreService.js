// src/services/firestoreService.js
// Alineado con la app Flutter (lib/services/firebase_service.dart,
// lib/rescate_unidos/services/persona_service.dart y metricas_service.dart).
//
// Colecciones Firestore (mismas que usa Flutter):
//   puntos_ayuda       — puntos aprobados/publicados. Escritura solo panel web.
//   solicitudes_punto  — registros ciudadanos pendientes de moderación.
//   reportes_urgentes  — emergencias (create-only desde la app, gestión aquí).
//   alertas_oficiales  — feed de Novedades.
//   contadores_zona    — agregados por estado (lectura).
//   confirmaciones     — confirmaciones de comunidad sobre un punto.
//   zonas_impacto      — severidad sísmica por zona (escritura solo panel web).
//   personas           — personas desaparecidas/encontradas (app + panel).
//   contadores_personas — agregado global {total, desaparecidos, encontrados}.
//   metricas_estados   — métricas "Venezuela Te Busca" por estado (panel → app).

import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, where,
  orderBy, limit, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

// ─── PUNTOS DE AYUDA (aprobados) ──────────────────────────────────────────────
export const subscribePuntos = (callback, filtros = {}) => {
  const constraints = []
  if (filtros.tipo)            constraints.push(where('tipo', '==', filtros.tipo))
  if (filtros.estado)          constraints.push(where('estado', '==', filtros.estado))
  if (filtros.estadoVenezuela) constraints.push(where('estadoVenezuela', '==', filtros.estadoVenezuela))
  if (filtros.estadoModeracion) constraints.push(where('estadoModeracion', '==', filtros.estadoModeracion))
  constraints.push(orderBy('ultimaActualizacion', 'desc'))
  // Límite para evitar descargar toda la colección en tiempo real.
  // El Dashboard usa contadores_zona para totales — no necesita todos los docs.
  constraints.push(limit(100))
  const q = query(collection(db, 'puntos_ayuda'), ...constraints)
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const actualizarPunto = (id, data) =>
  updateDoc(doc(db, 'puntos_ayuda', id), { ...data, ultimaActualizacion: serverTimestamp() })

export const cambiarEstadoPunto = (id, estado) =>
  updateDoc(doc(db, 'puntos_ayuda', id), { estado, ultimaActualizacion: serverTimestamp() })

// verificacion ∈ oficial | voluntario_verificado | comunidad
export const cambiarVerificacion = (id, verificacion, verificadoPor = null) =>
  updateDoc(doc(db, 'puntos_ayuda', id), {
    verificacion,
    verificadoPor: verificadoPor || null,
    ultimaActualizacion: serverTimestamp(),
  })

export const eliminarPunto = (id) =>
  deleteDoc(doc(db, 'puntos_ayuda', id))

// ─── SOLICITUDES DE PUNTO (moderación) ────────────────────────────────────────
export const subscribeSolicitudes = (estadoModeracion, callback) => {
  const constraints = []
  if (estadoModeracion && estadoModeracion !== 'todos') {
    constraints.push(where('estadoModeracion', '==', estadoModeracion))
  }
  constraints.push(orderBy('creadoEn', 'desc'))
  const q = query(collection(db, 'solicitudes_punto'), ...constraints, limit(200))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// Cuenta solicitudes pendientes (para el badge del sidebar)
export const subscribeSolicitudesPendientes = (callback) => {
  const q = query(collection(db, 'solicitudes_punto'), where('estadoModeracion', '==', 'pendiente'))
  return onSnapshot(q, snap => callback(snap.size))
}

/**
 * Aprueba una solicitud: la copia a `puntos_ayuda` con estadoModeracion
 * 'aprobado' y genera una alerta automática en el feed (igual que describe
 * el modelo Flutter: nuevo_punto_ayuda / nuevo_donante_servicio).
 */
export const aprobarSolicitud = async (solicitud, verificadoPor = null) => {
  const { id, ...data } = solicitud
  const batch = writeBatch(db)

  const puntoRef = doc(collection(db, 'puntos_ayuda'))
  batch.set(puntoRef, {
    ...data,
    estadoModeracion: 'aprobado',
    verificacion: data.verificacion || (verificadoPor ? 'oficial' : 'comunidad'),
    verificadoPor: verificadoPor || data.verificadoPor || null,
    creadoEn: data.creadoEn || serverTimestamp(),
    ultimaActualizacion: serverTimestamp(),
  })

  const esServicio = data.tipo === 'servicio_voluntario'
  const alertaRef = doc(collection(db, 'alertas_oficiales'))
  batch.set(alertaRef, {
    tipo: esServicio ? 'nuevo_donante_servicio' : 'nuevo_punto_ayuda',
    titulo: data.nombre || (esServicio ? 'Nuevo donante / servicio' : 'Nuevo punto de ayuda'),
    descripcion: data.descripcion || '',
    fuente: verificadoPor || 'RescateUnidos',
    verificado: true,
    nivel: 'informativa',
    zonasAfectadas: data.estadoVenezuela ? [data.estadoVenezuela] : [],
    enlaceExterno: null,
    puntoRelacionadoId: puntoRef.id,
    creadoEn: serverTimestamp(),
    expiraEn: null,
  })

  batch.delete(doc(db, 'solicitudes_punto', id))
  await batch.commit()
  return puntoRef.id
}

export const rechazarSolicitud = (id, motivo = '') =>
  updateDoc(doc(db, 'solicitudes_punto', id), {
    estadoModeracion: 'rechazado',
    motivoRechazo: motivo || null,
    ultimaActualizacion: serverTimestamp(),
  })

export const eliminarSolicitud = (id) =>
  deleteDoc(doc(db, 'solicitudes_punto', id))

// ─── REPORTES URGENTES ────────────────────────────────────────────────────────
export const subscribeReportes = (estado, callback) => {
  const constraints = []
  if (estado && estado !== 'todos') constraints.push(where('estado', '==', estado))
  constraints.push(orderBy('creadoEn', 'desc'))
  const q = query(collection(db, 'reportes_urgentes'), ...constraints, limit(100))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const actualizarEstadoReporte = (id, estado, atendidoPor = null) => {
  const data = { estado, actualizadoEn: serverTimestamp() }
  if (atendidoPor) data.atendidoPor = atendidoPor
  return updateDoc(doc(db, 'reportes_urgentes', id), data)
}

export const eliminarReporte = (id) =>
  deleteDoc(doc(db, 'reportes_urgentes', id))

// ─── ALERTAS OFICIALES ────────────────────────────────────────────────────────
export const subscribeAlertas = (callback) => {
  const q = query(collection(db, 'alertas_oficiales'), orderBy('creadoEn', 'desc'), limit(80))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// data: { tipo, titulo, descripcion, fuente, verificado, nivel,
//         zonasAfectadas[], enlaceExterno?, expiraEn? (Date|null) }
export const crearAlerta = (data) =>
  addDoc(collection(db, 'alertas_oficiales'), {
    tipo: data.tipo,
    titulo: data.titulo,
    descripcion: data.descripcion || '',
    fuente: data.fuente || '',
    verificado: data.verificado ?? false,
    nivel: data.nivel || 'informativa',
    zonasAfectadas: data.zonasAfectadas || [],
    enlaceExterno: data.enlaceExterno || null,
    puntoRelacionadoId: data.puntoRelacionadoId || null,
    expiraEn: data.expiraEn || null,
    creadoEn: serverTimestamp(),
  })

export const eliminarAlerta = (id) =>
  deleteDoc(doc(db, 'alertas_oficiales', id))

// ─── CONTADORES POR ZONA ──────────────────────────────────────────────────────
export const subscribeContadores = (callback) => {
  return onSnapshot(collection(db, 'contadores_zona'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── CONFIRMACIONES DE COMUNIDAD ─────────────────────────────────────────────
export const subscribeConfirmaciones = (puntoId, callback) => {
  const q = query(
    collection(db, 'confirmaciones'),
    where('puntoId', '==', puntoId),
    orderBy('creadoEn', 'desc'),
    limit(50)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── ZONAS DE IMPACTO ─────────────────────────────────────────────────────────
export const subscribeZonas = (callback) => {
  const q = query(collection(db, 'zonas_impacto'), orderBy('ultimaActualizacion', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const crearZona = (data) =>
  addDoc(collection(db, 'zonas_impacto'), {
    nombre: data.nombre,
    estadoVenezuela: data.estadoVenezuela,
    severidad: data.severidad || 'sin_danos',
    descripcion: data.descripcion || '',
    fuente: data.fuente || '',
    latitudCentro: data.latitudCentro ?? null,
    longitudCentro: data.longitudCentro ?? null,
    serviciosAfectados: data.serviciosAfectados || [],
    evaluadoEn: serverTimestamp(),
    ultimaActualizacion: serverTimestamp(),
  })

export const actualizarZona = (id, data) =>
  updateDoc(doc(db, 'zonas_impacto', id), { ...data, ultimaActualizacion: serverTimestamp() })

export const eliminarZona = (id) =>
  deleteDoc(doc(db, 'zonas_impacto', id))

// ─── VENEZUELACONECTA · RECURSOS (vc_recursos) ────────────────────────────────
// Mismas colecciones que usa VCService en Flutter
// (lib/venezuela_conecta/services/vc_service.dart). VC reutiliza el mismo
// proyecto Firebase 'rescateUnidos' (mappit-app1) y el mismo rol
// moderador/admin en usuarios/{uid} que el resto de este panel — por eso no
// se necesita una conexión ni un login separados.
//
// `vc_recursos` solo contiene recursos ya aprobados (por diseño: tanto
// `crearRecursoDirecto` como `aprobarSugerencia` fuerzan estadoModeracion a
// 'aprobado' al escribir aquí).
//
// FIX (30/06/2026): la regla de seguridad de `vc_recursos` es
//   allow read: if resource.data.estadoModeracion == 'aprobado'
// Firestore exige que las queries de COLECCIÓN sean evaluables sin abrir
// cada documento — si la query no filtra por el mismo campo que usa la
// regla, el snapshot completo se rechaza con PERMISSION_DENIED (no solo
// los docs no aprobados). Por eso hay que repetir el mismo `where` aquí,
// igual que ya hace VCService.streamRecursos en Flutter. Sin esto, la
// lista en el panel queda vacía en silencio porque onSnapshot no tenía
// callback de error.
//
// NOTA: este where + orderBy sobre campos distintos requiere un índice
// compuesto en Firestore (estadoModeracion + creadoEn). Si no se ha creado
// ese índice todavía, comentar la línea de orderBy de abajo y descomentar
// el .sort() en cliente — mismo criterio que VCService.streamRecursos en
// Flutter (where sin orderBy, ordena en Dart).
export const subscribeRecursos = (callback, filtros = {}, onError) => {
  const constraints = [where('estadoModeracion', '==', 'aprobado')]
  if (filtros.categoria)  constraints.push(where('categoria', '==', filtros.categoria))
  if (filtros.plataforma) constraints.push(where('plataforma', '==', filtros.plataforma))
  constraints.push(orderBy('creadoEn', 'desc'), limit(300))
  const q = query(collection(db, 'vc_recursos'), ...constraints)
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => {
      console.error('subscribeRecursos:', err)
      if (onError) onError(err)
    }
  )
}

// ─── Alternativa sin índice compuesto (no usada por defecto) ────────────────
// Si no quieres crear el índice en Firebase Console, usa esta versión en su
// lugar: mismo where, pero sin orderBy en Firestore — ordena en cliente.
// export const subscribeRecursos = (callback, filtros = {}, onError) => {
//   const constraints = [where('estadoModeracion', '==', 'aprobado')]
//   if (filtros.categoria)  constraints.push(where('categoria', '==', filtros.categoria))
//   if (filtros.plataforma) constraints.push(where('plataforma', '==', filtros.plataforma))
//   constraints.push(limit(300))
//   const q = query(collection(db, 'vc_recursos'), ...constraints)
//   return onSnapshot(
//     q,
//     snap => {
//       const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
//       lista.sort((a, b) => {
//         const ta = a.creadoEn?.toMillis?.() ?? 0
//         const tb = b.creadoEn?.toMillis?.() ?? 0
//         return tb - ta
//       })
//       callback(lista)
//     },
//     err => {
//       console.error('subscribeRecursos:', err)
//       if (onError) onError(err)
//     }
//   )
// }

// data: { nombre, descripcion?, url, categoria, plataforma, creadoPorUid?, creadoPorEmail? }
// Espejo de VCService.crearRecursoDirecto — admin publica directo, ya aprobado y verificado.
export const crearRecursoDirecto = (data) =>
  addDoc(collection(db, 'vc_recursos'), {
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    url: data.url,
    categoria: data.categoria,
    plataforma: data.plataforma,
    verificado: true,
    estadoModeracion: 'aprobado',
    creadoPorUid: data.creadoPorUid || null,
    creadoPorEmail: data.creadoPorEmail || null,
    creadoEn: serverTimestamp(),
    clicks: 0,
  })

// campos: cualquier subconjunto de nombre/descripcion/url/categoria/plataforma
export const editarRecurso = (id, campos) =>
  updateDoc(doc(db, 'vc_recursos', id), campos)

export const cambiarVerificadoRecurso = (id, verificado) =>
  updateDoc(doc(db, 'vc_recursos', id), { verificado })

export const eliminarRecurso = (id) =>
  deleteDoc(doc(db, 'vc_recursos', id))

// ─── VENEZUELACONECTA · SUGERENCIAS (vc_sugerencias) ──────────────────────────
export const subscribeSugerencias = (estadoModeracion, callback) => {
  const constraints = []
  if (estadoModeracion && estadoModeracion !== 'todos') {
    constraints.push(where('estadoModeracion', '==', estadoModeracion))
  }
  constraints.push(orderBy('creadoEn', 'desc'), limit(200))
  const q = query(collection(db, 'vc_sugerencias'), ...constraints)
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// Cuenta sugerencias pendientes (para el badge del sidebar)
export const subscribeSugerenciasPendientes = (callback) => {
  const q = query(collection(db, 'vc_sugerencias'), where('estadoModeracion', '==', 'pendiente'))
  return onSnapshot(q, snap => callback(snap.size))
}

/**
 * Aprueba una sugerencia: la copia a `vc_recursos` ya aprobada y verificada,
 * y la borra de `vc_sugerencias` — igual que VCService.aprobarSugerencia en
 * Flutter (mismo patrón de batch que aprobarSolicitud).
 */
export const aprobarSugerencia = async (sugerencia) => {
  const { id, ...data } = sugerencia
  const batch = writeBatch(db)
  const recursoRef = doc(collection(db, 'vc_recursos'))
  batch.set(recursoRef, {
    ...data,
    estadoModeracion: 'aprobado',
    verificado: true,
    creadoEn: data.creadoEn || serverTimestamp(),
    clicks: data.clicks ?? 0,
  })
  batch.delete(doc(db, 'vc_sugerencias', id))
  await batch.commit()
  return recursoRef.id
}

// Nota: a diferencia de rechazarSolicitud, el modelo Recurso no tiene campo
// `motivoRechazo` — se mantiene igual que VCService.rechazarSugerencia.
export const rechazarSugerencia = (id) =>
  updateDoc(doc(db, 'vc_sugerencias', id), {
    estadoModeracion: 'rechazado',
    ultimaActualizacion: serverTimestamp(),
  })

export const eliminarSugerencia = (id) =>
  deleteDoc(doc(db, 'vc_sugerencias', id))

// ─── STATS GENERALES ──────────────────────────────────────────────────────────
export const getStats = async () => {
  const [puntosSnap, solicitudesSnap, reportesSnap, alertasSnap, recursosSnap, sugerenciasSnap] = await Promise.all([
    getDocs(collection(db, 'puntos_ayuda')),
    getDocs(query(collection(db, 'solicitudes_punto'), where('estadoModeracion', '==', 'pendiente'))),
    getDocs(collection(db, 'reportes_urgentes')),
    getDocs(collection(db, 'alertas_oficiales')),
    getDocs(collection(db, 'vc_recursos')),
    getDocs(query(collection(db, 'vc_sugerencias'), where('estadoModeracion', '==', 'pendiente'))),
  ])
  const puntos   = puntosSnap.docs.map(d => d.data())
  const reportes = reportesSnap.docs.map(d => d.data())
  return {
    totalPuntos:         puntos.length,
    puntosOperativos:    puntos.filter(p => p.estado === 'operativo').length,
    puntosVerificados:   puntos.filter(p => p.verificacion && p.verificacion !== 'comunidad').length,
    solicitudesPendientes: solicitudesSnap.size,
    reportesPendientes:  reportes.filter(r => r.estado === 'reportado').length,
    reportesEnAtencion:  reportes.filter(r => r.estado === 'en_atencion').length,
    reportesResueltos:   reportes.filter(r => r.estado?.startsWith('resuelto')).length,
    totalAlertas:        alertasSnap.size,
    totalRecursos:       recursosSnap.size,
    sugerenciasPendientes: sugerenciasSnap.size,
  }
}

// ─── PERSONAS (desaparecidos / encontrados) ───────────────────────────────────
// Mismo patrón que PersonaService en Flutter (lib/rescate_unidos/services/
// persona_service.dart). El panel puede registrar, buscar, editar estado y
// eliminar — espejo de lo que la app permite a ciudadanos/moderadores.

export const subscribePersonas = (filtro, callback) => {
  const constraints = []
  if (filtro && filtro !== 'todos') {
    if (filtro === 'desaparecida') {
      constraints.push(where('estado', '==', 'desaparecida'))
    } else {
      // encontrada / en_hospital / en_refugio se agrupan como "localizadas"
      constraints.push(where('estado', 'in', ['encontrada', 'en_hospital', 'en_refugio']))
    }
  }
  constraints.push(orderBy('fechaReporte', 'desc'), limit(300))
  const q = query(collection(db, 'personas'), ...constraints)
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// data: { nombre, cedula?, edad?, sexo?, ultimaUbicacion, estadoVenezolano?,
//         fotoUrl?, descripcion?, reportadoPor? }
// nombreNorm se calcula en cliente para que la búsqueda fuzzy de la app
// (PersonaService.buscar) siga funcionando igual sobre registros creados aquí.
const normalizarNombre = (s) => {
  const ac = { á:'a', é:'e', í:'i', ó:'o', ú:'u', ñ:'n', ü:'u' }
  let r = (s ?? '').toLowerCase().trim()
  for (const [k, v] of Object.entries(ac)) r = r.replaceAll(k, v)
  return r
}

export const crearPersona = (data) =>
  addDoc(collection(db, 'personas'), {
    nombre: data.nombre.trim(),
    nombreNorm: normalizarNombre(data.nombre),
    cedula: data.cedula || null,
    edad: data.edad === '' || data.edad == null ? null : Number(data.edad),
    sexo: data.sexo || null,
    estado: data.estado || 'desaparecida',
    ultimaUbicacion: data.ultimaUbicacion?.trim() || '',
    estadoVenezolano: data.estadoVenezolano || null,
    fotoUrl: data.fotoUrl || null,
    descripcion: data.descripcion || null,
    reportadoPor: data.reportadoPor || null,
    fechaReporte: serverTimestamp(),
  })

export const editarPersona = (id, data) => {
  const payload = { ...data }
  if (payload.nombre) payload.nombreNorm = normalizarNombre(payload.nombre)
  if (payload.edad === '' || payload.edad == null) payload.edad = null
  else payload.edad = Number(payload.edad)
  return updateDoc(doc(db, 'personas', id), payload)
}

// Espejo de PersonaService.marcarEncontrado — solo toca los 4 campos que
// permiten las Firestore rules para esta transición.
export const marcarPersonaEncontrada = (id, { estado, encontradoPor, ubicacionEncontrada }) =>
  updateDoc(doc(db, 'personas', id), {
    estado,
    encontradoPor: encontradoPor || null,
    ubicacionEncontrada: ubicacionEncontrada || null,
    fechaEncontrado: serverTimestamp(),
  })

export const eliminarPersona = (id) =>
  deleteDoc(doc(db, 'personas', id))

// ─── CONTADORES DE PERSONAS (global) ──────────────────────────────────────────
// Documento único contadores_personas/global — espejo de
// PersonaService.streamContadores en Flutter.
export const subscribeContadoresPersonas = (callback) => {
  return onSnapshot(doc(db, 'contadores_personas', 'global'), snap => {
    const d = snap.exists() ? snap.data() : {}
    callback({
      total: d.total ?? 0,
      desaparecidos: d.desaparecidos ?? 0,
      encontrados: d.encontrados ?? 0,
    })
  })
}

// ─── MÉTRICAS POR ESTADO (Venezuela Te Busca) ─────────────────────────────────
// Espejo de MetricasService en Flutter (lib/rescate_unidos/services/
// metricas_service.dart). El panel puede cargar/editar manualmente sin
// depender del flujo CSV de la app — útil para correcciones puntuales.

export const subscribeMetricas = (callback) => {
  const q = query(collection(db, 'metricas_estados'), orderBy('__name__'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// Guarda (upsert completo) una métrica de un estado — mismo formato que
// MetricaEstado.toFirestore(). `id` debe venir de idDeEstado(estado).
export const guardarMetricaEstado = (id, data) =>
  setDoc(doc(db, 'metricas_estados', id), {
    estado: data.estado,
    totalPersonas: Number(data.totalPersonas) || 0,
    desaparecidos: Number(data.desaparecidos) || 0,
    encontrados: Number(data.encontrados) || 0,
    enHospital: Number(data.enHospital) || 0,
    enRefugio: Number(data.enRefugio) || 0,
    nivel: data.nivel,
    fechaCarga: serverTimestamp(),
  })

// Carga masiva (batch) de varias métricas a la vez — mismo patrón que
// MetricasService.guardarMetricas en Flutter (un solo WriteBatch para los
// 24 estados, < 500 operaciones).
export const guardarMetricasEnLote = async (metricas) => {
  const batch = writeBatch(db)
  for (const m of metricas) {
    const ref = doc(db, 'metricas_estados', m.id)
    batch.set(ref, {
      estado: m.estado,
      totalPersonas: Number(m.totalPersonas) || 0,
      desaparecidos: Number(m.desaparecidos) || 0,
      encontrados: Number(m.encontrados) || 0,
      enHospital: Number(m.enHospital) || 0,
      enRefugio: Number(m.enRefugio) || 0,
      nivel: m.nivel,
      fechaCarga: serverTimestamp(),
    })
  }
  await batch.commit()
}

export const eliminarMetricaEstado = (id) =>
  deleteDoc(doc(db, 'metricas_estados', id))
