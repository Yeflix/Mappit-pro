// src/services/firestoreService.js
// Alineado con la app Flutter (lib/services/firebase_service.dart).
//
// Colecciones Firestore (mismas que usa Flutter):
//   puntos_ayuda       — puntos aprobados/publicados. Escritura solo panel web.
//   solicitudes_punto  — registros ciudadanos pendientes de moderación.
//   reportes_urgentes  — emergencias (create-only desde la app, gestión aquí).
//   alertas_oficiales  — feed de Novedades.
//   contadores_zona    — agregados por estado (lectura).
//   confirmaciones     — confirmaciones de comunidad sobre un punto.
//   zonas_impacto      — severidad sísmica por zona (escritura solo panel web).

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
// 'aprobado' al escribir aquí). No requiere filtro de moderación al leer.
export const subscribeRecursos = (callback, filtros = {}) => {
  const constraints = []
  if (filtros.categoria)  constraints.push(where('categoria', '==', filtros.categoria))
  if (filtros.plataforma) constraints.push(where('plataforma', '==', filtros.plataforma))
  constraints.push(orderBy('creadoEn', 'desc'), limit(300))
  const q = query(collection(db, 'vc_recursos'), ...constraints)
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

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
