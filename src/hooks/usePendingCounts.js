import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  subscribeSolicitudesPendientes,
  subscribeSugerenciasPendientes,
} from '../services/firestoreService'

/**
 * Suscribe en tiempo real a los contadores de pendientes que alimentan
 * los badges del sidebar. Devuelve { reportes, solicitudes, sugerencias }.
 */
export function usePendingCounts() {
  const [reportes, setReportes] = useState(0)
  const [solicitudes, setSolicitudes] = useState(0)
  const [sugerencias, setSugerencias] = useState(0)

  useEffect(() => {
    const q = query(
      collection(db, 'reportes_urgentes'),
      where('estado', '==', 'reportado'),
    )
    const u1 = onSnapshot(q, snap => setReportes(snap.size))
    const u2 = subscribeSolicitudesPendientes(setSolicitudes)
    const u3 = subscribeSugerenciasPendientes(setSugerencias)
    return () => { u1(); u2(); u3() }
  }, [])

  return { reportes, solicitudes, sugerencias }
}
