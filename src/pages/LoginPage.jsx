import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !pass) return toast.error('Completa todos los campos')
    setLoading(true)
    try {
      await login(email, pass)
      toast.success('Bienvenido al panel de moderación')
    } catch (err) {
      if (err.code === 'rol-insuficiente') {
        toast.error('Tu cuenta no tiene acceso al panel de moderación')
      } else {
        toast.error('Credenciales incorrectas')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 mb-4">
            <ShieldAlert size={26} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-red-400">Rescate</span>
            <span className="text-slate-200 font-light">Unidos</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Panel de moderación</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              className="input"
              placeholder="admin@rescateunidos.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Acceso restringido — solo moderadores autorizados
        </p>
      </div>
    </div>
  )
}