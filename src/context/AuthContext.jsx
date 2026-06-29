// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

// Roles con acceso al panel de moderación
const ROLES_PANEL = ['moderador', 'admin']

async function fetchRol(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  return snap.exists() ? snap.data().rol : null
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [rol,     setRol]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setRol(null)
        setLoading(false)
        return
      }

      try {
        const rolFirestore = await fetchRol(u.uid)
        if (ROLES_PANEL.includes(rolFirestore)) {
          setUser(u)
          setRol(rolFirestore)
        } else {
          // Sesión válida pero sin permiso de panel — cerrar automáticamente
          await signOut(auth)
          setUser(null)
          setRol(null)
        }
      } catch (err) {
        console.error('Error verificando rol:', err)
        await signOut(auth)
        setUser(null)
        setRol(null)
      }

      setLoading(false)
    })
    return unsub
  }, [])

  /**
   * Login con verificación de rol inline.
   * Lanza error con código 'rol-insuficiente' si las credenciales son válidas
   * pero el usuario no tiene acceso al panel.
   */
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const rolFirestore = await fetchRol(cred.user.uid)
    if (!ROLES_PANEL.includes(rolFirestore)) {
      await signOut(auth)
      const err = new Error('Sin acceso al panel de moderación')
      err.code = 'rol-insuficiente'
      throw err
    }
    return cred
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
